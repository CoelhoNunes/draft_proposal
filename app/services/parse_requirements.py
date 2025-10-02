from typing import List, Dict
import json
from ..llm.adapter import LLMAdapter
from ..llm.prompts import PARSE_REQUIREMENTS_INSTRUCTION

async def extract_requirements(document_text: str) -> List[Dict]:
    llm = LLMAdapter()
    messages = [
        {"role":"system","content":"You convert RFP text into a normalized list of requirements."},
        {"role":"user","content":PARSE_REQUIREMENTS_INSTRUCTION + "\n\nRFP TEXT:\n" + document_text[:12000]}
    ]
    raw = await llm.chat(messages)
    # Strip common code fences or prose wrappers
    if raw.strip().startswith("```"):
        raw = raw.strip().strip('`')
    # If model included extra commentary, try to isolate a JSON array
    try:
        data = json.loads(raw)
        assert isinstance(data, list)
        return data
    except Exception:
        # Try to salvage JSON from text
        import re
        m = re.search(r"\[.*\]", raw, re.S)
        if m:
            try:
                data = json.loads(m.group(0))
                return data
            except Exception:
                pass
        # Minimal fallback
        return [{
            "id": "REQ-1",
            "section": "General",
            "text": "Unable to parse programmatically; please review.",
            "must": True,
            "due": None,
            "artifact_type": None
        }]
