from typing import Tuple
from pdfminer.high_level import extract_text
from docx import Document
import os

def normalize_file_to_text(path: str) -> Tuple[str, str]:
    """Return (text, mime_hint).

    Supports PDF and DOCX. Falls back to raw bytes decode for .txt.
    """
    ext = os.path.splitext(path)[1].lower()
    if ext == ".pdf":
        txt = extract_text(path) or ""
        return txt, "application/pdf"
    if ext == ".docx":
        doc = Document(path)
        txt = "\n".join(p.text for p in doc.paragraphs)
        return txt, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    # naive fallback
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read(), "text/plain"
