from typing import List, Dict
from ..llm.adapter import LLMAdapter
from ..llm.prompts import SYSTEM_FEDRAMP_ONLY, SYNTHESIZE_ANSWER_INSTRUCTION
import os, glob

def load_kb_snippets(max_chars: int = 16000) -> str:
    parts = []
    total = 0
    for path in glob.glob(os.path.join("fedramp_kb", "**", "*.*"), recursive=True):
        if os.path.isdir(path):
            continue
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                t = f.read()
        except Exception:
            continue
        if total + len(t) > max_chars:
            break
        parts.append(f"\n# SOURCE: {os.path.basename(path)}\n{t}\n")
        total += len(t)
    return "\n".join(parts) if parts else ""

async def synthesize_html(requirements: List[Dict], company_rules: str = "") -> str:
    llm = LLMAdapter()
    kb = load_kb_snippets()
    req_text = "\n".join([f"- [{ 'MUST' if r.get('must') else 'SHOULD' }] {r.get('section')}: {r.get('text')}" for r in requirements])
    messages = [
        {"role":"system","content":SYSTEM_FEDRAMP_ONLY},
        {"role":"user","content":SYNTHESIZE_ANSWER_INSTRUCTION + f"\n\nHOUSE RULES:\n{company_rules}\n\nRFP REQUIREMENTS:\n{req_text}\n\nFEDRAMP CONTEXT:\n{kb}"}
    ]
    # If constraints hint at multi-page output, increase token budget
    max_tokens = 3500 if ("MUST" in req_text and "page" in req_text.lower()) else 2000
    content = await llm.chat(messages, max_tokens=max_tokens)
    # Sanitize markdown remnants and bold markers
    body = content
    body = body.replace("```html", "").replace("```", "").replace("**", "").strip()
    styled = (
        "<div class='prose prose-invert max-w-none'>"
        "  <article id='draft-article' style=\"font-family: 'Georgia', serif; line-height: 1.6;\">"
        f"    {body}"
        "  </article>"
        "</div>"
        "<script>\n"
        "document.addEventListener('mouseover', function(e){\n"
        "  const el = e.target.closest('[data-req-id]');\n"
        "  if(!el) return;\n"
        "  el.style.outline = '2px solid #6366f1';\n"
        "});\n"
        "document.addEventListener('mouseout', function(e){\n"
        "  const el = e.target.closest('[data-req-id]');\n"
        "  if(!el) return;\n"
        "  el.style.outline = '';\n"
        "});\n"
        "window.highlightRequirement = function(reqId){\n"
        "  document.querySelectorAll('#draft-article [data-req-id]').forEach(function(n){ n.style.outline=''; });\n"
        "  var selector = '#draft-article [data-req-id="' + reqId + '"]';\n"
        "  var target = document.querySelector(selector);\n"
        "  if(target){\n"
        "    target.scrollIntoView({behavior: 'smooth', block: 'start'});\n"
        "    target.style.outline = '3px solid #22c55e';\n"
        "    setTimeout(function(){ target.style.outline=''; }, 1500);\n"
        "  }\n"
        "};\n"
        "window.highlightFromChecklist = function(el){\n"
        "  var reqId = el.getAttribute('data-req-id');\n"
        "  window.highlightRequirement && window.highlightRequirement(reqId);\n"
        "};\n"
        "</script>"
    )
    return styled
