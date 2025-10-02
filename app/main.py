from fastapi import FastAPI, Request, UploadFile, File, Form
from fastapi.responses import HTMLResponse, FileResponse, PlainTextResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlmodel import select
import os, hashlib, uuid, asyncio

from .db import init_db, get_session
from .models import Run, Artifact, ChecklistItem
from .services.normalize import normalize_file_to_text
from .services.parse_requirements import extract_requirements
from .services.synthesize import synthesize_html
from .services.export_pdf import export_pdf_from_html
from .services.sharepoint import list_sharepoint_files, download_sharepoint_file

app = FastAPI(title="FedRAMP RFP Assistant", version="0.1.0")
app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

STORAGE_DIR = "storage"
os.makedirs(STORAGE_DIR, exist_ok=True)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/runs", response_class=HTMLResponse)
def list_runs(request: Request):
    with get_session() as s:
        runs = s.exec(select(Run).order_by(Run.created_at.asc())).all()
    html = []
    for r in runs:
        html.append(f"""
            <div id='run-{r.id}' class='run-row flex items-center justify-between border border-gray-800 rounded-lg p-3 mb-2 bg-gray-900/60'>
              <div>
                <div class='font-semibold'>{r.name}</div>
                <div class='text-xs text-gray-400'>Run #{r.id}</div>
              </div>
              <div class='flex items-center gap-2'>
                <button hx-get='/run/{r.id}' hx-target='#main' class='px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold'>Open</button>
                <button hx-delete='/run/{r.id}' hx-target='#run-{r.id}' hx-swap='outerHTML' class='px-3 py-1.5 rounded-md bg-red-700 hover:bg-red-600 text-sm'>Delete</button>
              </div>
            </div>
        """)
    if not html:
        html.append("<div class='text-gray-500'>No runs yet.</div>")
    return HTMLResponse("".join(html))

@app.post("/upload", response_class=HTMLResponse)
async def upload(request: Request, name: str = Form(...), file: UploadFile = File(...)):
    # Persist original
    run = Run(name=name)
    with get_session() as s:
        s.add(run)
        s.commit()
        s.refresh(run)

    ext = os.path.splitext(file.filename)[1].lower()
    dest = os.path.join(STORAGE_DIR, f"run{run.id}_orig{ext}")
    with open(dest, "wb") as f:
        f.write(await file.read())

    # Record artifact
    with get_session() as s:
        art = Artifact(run_id=run.id, type="original", path=dest, hash=_hashfile(dest))
        s.add(art)
        s.commit()

    # Normalize → text
    text, _ = normalize_file_to_text(dest)
    norm_path = os.path.join(STORAGE_DIR, f"run{run.id}_normalized.txt")
    with open(norm_path, "w", encoding="utf-8") as f:
        f.write(text)
    with get_session() as s:
        s.add(Artifact(run_id=run.id, type="normalized_text", path=norm_path))
        s.commit()

    # Extract requirements (LLM)
    reqs = await extract_requirements(text)
    # Insert checklist
    with get_session() as s:
        for r in reqs:
            item = ChecklistItem(
                run_id=run.id,
                requirement_id=str(r.get("id") or uuid.uuid4())[:12],
                section=r.get("section") or "General",
                text=r.get("text") or "(empty)",
                must=bool(r.get("must", True)),
                due=r.get("due"),
                artifact_type=r.get("artifact_type"),
            )
            s.add(item)
        s.commit()

    return await open_run(request, run.id)

@app.get("/run/{run_id}", response_class=HTMLResponse)
async def open_run(request: Request, run_id: int):
    # Render main panel with checklist/draft/preview
    with get_session() as s:
        run = s.get(Run, run_id)
        items = s.exec(select(ChecklistItem).where(ChecklistItem.run_id == run_id)).all()
    checklist_html = _render_checklist(items, run_id)
    draft_html = await ensure_draft(run_id)
    preview_html = _render_preview(run_id)
    total = len(items)
    done = len([i for i in items if i.status == "done"])
    can_export = done == total and total > 0
    export_disabled = 'disabled' if not can_export else ''
    export_classes = 'bg-green-700 px-3 py-2 rounded ' + ('opacity-50 cursor-not-allowed' if not can_export else '')
    return HTMLResponse(f"""
        <div class='flex items-center justify-between'>
            <div><h1 class='text-2xl font-bold'>Run: {run.name}</h1><div class='text-gray-400 text-sm'>Run #{run.id}</div></div>
            <div class='space-x-2'>
                <button hx-get='/run/{run.id}/draft' hx-target='#draft' class='bg-indigo-600 px-3 py-2 rounded'>Generate Draft</button>
                <button {export_disabled} hx-post='/run/{run.id}/export' hx-target='#preview' class='{export_classes}'>Export PDF</button>
            </div>
        </div>
        <div class='grid grid-cols-2 gap-4 mt-4'>
            <section class='col-span-1'>
              <div class='flex items-center justify-between mb-2 text-sm text-gray-400'>
                <div>Progress: {done}/{total} complete</div>
                <div>{'All deliverables complete' if can_export else 'Complete all to enable Export'}</div>
              </div>
              <div id='checklist' class='border border-gray-800 rounded p-3'>{checklist_html}</div>
            </section>
            <section class='col-span-1'>
              <div id='draft' class='border border-gray-800 rounded p-3'>{draft_html}</div>
              <div id='preview' class='border border-gray-800 rounded p-3 mt-4'>{preview_html}</div>
            </section>
        </div>
    """)

@app.patch("/run/{run_id}/item/{item_id}/toggle", response_class=HTMLResponse)
async def toggle_item(request: Request, run_id: int, item_id: int):
    with get_session() as s:
        item = s.get(ChecklistItem, item_id)
        if not item or item.run_id != run_id:
            return PlainTextResponse("Not found", status_code=404)
        item.status = "done" if item.status != "done" else "todo"
        s.add(item)
        s.commit()
    return await open_run(request, run_id)

@app.delete("/run/{run_id}")
def delete_run(request: Request, run_id: int):
    # Soft delete artifacts/files then delete DB rows
    with get_session() as s:
        run = s.get(Run, run_id)
        # If it's already missing, still return success so UI removes the row
        if not run:
            return HTMLResponse("")
        # delete artifacts files and rows
        arts = s.exec(select(Artifact).where(Artifact.run_id == run_id)).all()
        for a in arts:
            try:
                os.remove(a.path)
            except Exception:
                pass
            s.delete(a)
        # delete checklist items
        items = s.exec(select(ChecklistItem).where(ChecklistItem.run_id == run_id)).all()
        for it in items:
            s.delete(it)
        # delete run last
        s.delete(run)
        s.commit()
    # Return refreshed runs list for sidebar
    # HTMX will remove the row with outerHTML swap on 204/empty body
    # Return empty 200 so HTMX outerHTML swap removes the row cleanly
    return HTMLResponse("")

@app.get("/run/{run_id}/draft", response_class=HTMLResponse)
async def regenerate_draft(request: Request, run_id: int):
    html = await ensure_draft(run_id, force=True)
    return HTMLResponse(html)

@app.post("/run/{run_id}/export", response_class=HTMLResponse)
async def export_pdf(request: Request, run_id: int):
    with get_session() as s:
        art = s.exec(select(Artifact).where(Artifact.run_id == run_id, Artifact.type == "draft_html")).first()
    if not art:
        return PlainTextResponse("No draft yet", status_code=400)
    out_path = os.path.join(STORAGE_DIR, f"run{run_id}_response.pdf")
    export_pdf_from_html(open(art.path, "r", encoding="utf-8").read(), out_path)
    with get_session() as s:
        s.add(Artifact(run_id=run_id, type="pdf", path=out_path))
        s.commit()
    return HTMLResponse(f"<div>PDF exported. <a href='/download/{os.path.basename(out_path)}' class='underline'>Download</a></div>")

@app.get("/download/{fname}")
def download(fname: str):
    path = os.path.join(STORAGE_DIR, fname)
    return FileResponse(path, filename=fname)

@app.get("/files/search", response_class=HTMLResponse)
def files_search(request: Request, q: str = ""):
    return HTMLResponse(f"<div class='text-gray-400'>Search requested: {q or '(empty)'} — integrate your FileShare here.</div>")

def _render_checklist(items, run_id: int) -> str:
    rows = []
    if not items:
        return "<div class='text-gray-400'>No checklist yet.</div>"
    for it in items:
        badge = "MUST" if it.must else "SHOULD"
        checked = "checked" if it.status == "done" else ""
        safe_text = (it.text or '').replace('"','&quot;')[:200]
        rows.append(f"""
          <div class='border border-gray-800 rounded p-2 mb-2 flex items-start gap-3' data-req-id='{it.requirement_id}' data-req-text="{safe_text}" onmouseenter="window.highlightFromChecklist && window.highlightFromChecklist(this)" onclick="window.highlightFromChecklist && window.highlightFromChecklist(this)">
            <input type='checkbox' {checked} hx-patch='/run/{run_id}/item/{it.id}/toggle' hx-target='#main' class='mt-1 h-4 w-4'>
            <div>
              <div class='text-xs text-gray-400'>[{badge}] {it.section} • {it.requirement_id}</div>
              <div class='font-medium'>{it.text}</div>
              <div class='text-xs text-gray-500'>Due: {it.due or '-'} • Artifact: {it.artifact_type or '-'} </div>
            </div>
          </div>
        """)
    return "".join(rows)

async def ensure_draft(run_id: int, force: bool = False) -> str:
    # Return existing draft HTML artifact or generate
    with get_session() as s:
        draft = s.exec(select(Artifact).where(Artifact.run_id == run_id, Artifact.type == "draft_html")).first()
        items = s.exec(select(ChecklistItem).where(ChecklistItem.run_id == run_id)).all()
    if draft and not force:
        try:
            return open(draft.path, "r", encoding="utf-8").read()
        except FileNotFoundError:
            # regenerate if file missing
            pass

    html = await synthesize_html([i.__dict__ for i in items], company_rules="Use precise, evidence-based claims. Avoid overcommitment.")
    path = os.path.join(STORAGE_DIR, f"run{run_id}_draft.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    with get_session() as s:
        s.add(Artifact(run_id=run_id, type="draft_html", path=path))
        s.commit()
    return html

def _hashfile(path: str) -> str:
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()

def _render_preview(run_id: int) -> str:
    with get_session() as s:
        pdf = s.exec(select(Artifact).where(Artifact.run_id == run_id, Artifact.type == "pdf")).first()
        draft = s.exec(select(Artifact).where(Artifact.run_id == run_id, Artifact.type == "draft_html")).first()
    if pdf:
        fname = os.path.basename(pdf.path)
        return f"<div>PDF ready: <a href='/download/{fname}' class='underline'>Download</a></div>"
    if draft:
        return "<div>No PDF yet. Click Export PDF to generate from the current draft.</div>"
    return "<div class='text-gray-500'>No preview yet. Generate draft first.</div>"
