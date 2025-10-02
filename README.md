# FedRAMP RFP Assistant (FastAPI + HTMX/Tailwind)

Clean, fast, **no-nonsense** RFP assistant for parsing proposals, building a checklist of deliverables,
and generating a FedRAMP‑only draft response + exportable PDF. The UI mirrors the reference layout:
**left sidebar** (RFPs / runs / checklist) and **right content** (Checklist, Draft, PDF Preview).

> ⚠️ This is an MVP scaffold designed to run locally out‑of‑the‑box.  
> - SharePoint is **stubbed** with working endpoints and clear TODOs for Microsoft Graph.  
> - The LLM adapter now uses **OpenAI** exclusively via `OPENAI_KEY`.  
> - If no provider credentials are present, the app runs in **mock mode** for demos/tests.

---

## Features

- 🗂️ **Drag‑and‑drop** file upload (PDF/DOCX), plus **SharePoint** list/download stubs
- 🧹 **Document normalizer** → clean text from PDFs/DOCX
- 🧩 **RFP requirement parser** → structured JSON checklist (must/should, due, artifact type)
- 🛡️ **FedRAMP‑only** synthesis guard (prompts constrained to supplied KB/context)
- 📝 **Draft answer** generator (respects "house rules")
- ✅ **Editable checklist** in UI (add/remove/update items)
- 🧾 **PDF export** of final response (ReportLab)
- 🧠 **LLM adapter**: `gpt-oss` (20b) and `openai` (via `.env`), or **mock** if keys unset
- 🗃️ **SQLite** for runs, artifacts, and checklist items
- 🧰 **FastAPI** backend, **HTMX + Tailwind** for fast/crisp UI without heavy JS frameworks

---

## Quickstart

### 1) Requirements
- Python 3.10+
- (Optional) wkhtmltopdf **not required**. We use ReportLab.

### 2) Setup

```bash
# from the project root
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

pip install -r requirements.txt
cp .env.example .env
# edit .env to set your provider and keys
```

### 3) Run

```bash
uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000

### 4) LLM Configuration (OpenAI only)

Set these in `.env`:

- `OPENAI_KEY=` (leave empty, then paste your key later)
- `OPENAI_MODEL=gpt-4o-mini` (or your choice)

If `OPENAI_KEY` is not set, the app uses a simple **mock mode** placeholder response.

### 5) SharePoint (stub → Graph)

- Update `.env`:
  - `SP_TENANT_ID=...`
  - `SP_CLIENT_ID=...`
  - `SP_CLIENT_SECRET=...`
  - `SP_SITE_ID=...`

Endpoints are implemented with clear TODOs and graceful failures if unset.

---

## Project Structure

```
fedramp_rfp_assistant/
├─ app/
│  ├─ main.py                # FastAPI app & routes
│  ├─ models.py              # SQLModel ORM models
│  ├─ db.py                  # DB init/session helpers
│  ├─ llm/
│  │   ├─ adapter.py         # Unified LLM interface (gpt-oss/openai/mock)
│  │   └─ prompts.py         # System/user prompts (FedRAMP guard, parsing, synthesis)
│  ├─ services/
│  │   ├─ normalize.py       # PDF/DOCX → clean text
│  │   ├─ parse_requirements.py # Extract deliverables → JSON checklist
│  │   ├─ synthesize.py      # Draft response generator
│  │   ├─ export_pdf.py      # ReportLab export
│  │   └─ sharepoint.py      # SharePoint stubs + Graph TODOs
│  ├─ templates/
│  │   ├─ base.html
│  │   └─ index.html
│  └─ static/
│      └─ app.css            # Minimal CSS (Tailwind via CDN in templates)
├─ fedramp_kb/               # Put your FedRAMP reference .md/.txt here
│  └─ README.md
├─ .env.example
├─ requirements.txt
└─ README.md
```

---

## Design Notes

- **Deterministic graph:** while we’re not wiring LangGraph here, functions are cleanly separated so you can wrap them in a graph/orchestrator later.
- **Schemas everywhere:** parser & checklist return typed dicts for stability.
- **FedRAMP‑only:** The synthesizer is **always** grounded with KB text and a strict system prompt; it refuses to answer outside that domain.
- **Performance:** minimal deps, single pass parsers, and cached DB rows by `run_id`.

---

## Disclaimer

This is sample code for demonstration. Validate outputs with your compliance team.
Integrations (SharePoint/Graph, provider URLs) are your responsibility.

---

## License

Apache-2.0
