from reportlab.lib.pagesizes import LETTER
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib.utils import simpleSplit
from bs4 import BeautifulSoup

def html_to_text(html: str) -> str:
    # Very naive HTML→text to keep deps light (use BeautifulSoup for tags)
    try:
        soup = BeautifulSoup(html, 'html.parser')
        return soup.get_text('\n')
    except Exception:
        return html

def export_pdf_from_html(html: str, out_path: str):
    text = html_to_text(html)
    c = canvas.Canvas(out_path, pagesize=LETTER)
    width, height = LETTER

    margin = 0.75 * inch
    max_width = width - 2 * margin
    cursor_y = height - margin

    lines = text.split('\n')
    for line in lines:
        wrapped = simpleSplit(line, 'Helvetica', 10, max_width)
        for frag in wrapped:
            if cursor_y < margin:
                c.showPage()
                cursor_y = height - margin
            c.setFont('Helvetica', 10)
            c.drawString(margin, cursor_y, frag)
            cursor_y -= 14
    c.showPage()
    c.save()
