#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从 content_data.json 生成 川农智伴技术说明.docx"""
import json, os
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn, nsdecls
from docx.oxml import parse_xml

with open(os.path.join(os.path.dirname(__file__), 'content_data.json'),
          'r', encoding='utf-8') as f:
    data = json.load(f)

doc = Document()
for sec in doc.sections:
    sec.page_width = Cm(21)
    sec.page_height = Cm(29.7)
    sec.top_margin = Cm(2.54)
    sec.bottom_margin = Cm(2.54)
    sec.left_margin = Cm(3.17)
    sec.right_margin = Cm(3.17)

sty = doc.styles['Normal']
sty.font.name = 'Arial'
sty.font.size = Pt(10.5)
sty.element.rPr.rFonts.set(qn('w:eastAsia'), 'SimSun')
sty.paragraph_format.line_spacing = 1.5
sty.paragraph_format.space_after = Pt(6)

def shd(cell, color):
    cell._tc.get_or_add_tcPr().append(
        parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color}"/>'))

for entry in data["paragraphs"]:
    cmd = entry[0]
    text = entry[1] if len(entry) > 1 else ""
    if cmd == "e":
        doc.add_paragraph()
    elif cmd == "pb":
        doc.add_page_break()
    elif cmd == "h1":
        p = doc.add_heading(text, level=1)
        for r in p.runs:
            r.font.color.rgb = RGBColor(0x1F, 0x38, 0x64)
            r.font.name = 'Arial'
            r.element.rPr.rFonts.set(qn('w:eastAsia'), 'SimHei')
    elif cmd == "h2":
        p = doc.add_heading(text, level=2)
        for r in p.runs:
            r.font.color.rgb = RGBColor(0x2E, 0x75, 0xB6)
            r.font.name = 'Arial'
            r.element.rPr.rFonts.set(qn('w:eastAsia'), 'SimHei')
    elif cmd == "h3":
        p = doc.add_heading(text, level=3)
        for r in p.runs:
            r.font.color.rgb = RGBColor(0x40, 0x40, 0x40)
            r.font.name = 'Arial'
            r.element.rPr.rFonts.set(qn('w:eastAsia'), 'SimHei')
    elif cmd == "p":
        p = doc.add_paragraph()
        p.paragraph_format.first_line_indent = Pt(21)
        r = p.add_run(text)
        r.font.name = 'Arial'
        r.element.rPr.rFonts.set(qn('w:eastAsia'), 'SimSun')
        r.font.size = Pt(10.5)
    elif cmd == "pni":
        p = doc.add_paragraph()
        r = p.add_run(text)
        r.font.name = 'Arial'
        r.element.rPr.rFonts.set(qn('w:eastAsia'), 'SimSun')
        r.font.size = Pt(10.5)
    elif cmd == "kb":
        p = doc.add_paragraph()
        r = p.add_run(text)
        r.bold = True; r.font.name = 'Arial'
        r.element.rPr.rFonts.set(qn('w:eastAsia'), 'SimSun')
        r.font.size = Pt(10.5)
    elif cmd == "cc":
        import json as j2
        t, sz, cl, bl = j2.loads(text)
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(t)
        r.font.size = Pt(sz); r.bold = bl
        r.font.color.rgb = RGBColor(*[int(cl[i:i+2],16) for i in (0,2,4)])
        r.font.name = 'Arial'
        r.element.rPr.rFonts.set(qn('w:eastAsia'), 'SimHei')
    elif cmd == "sub":
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(text)
        r.font.size = Pt(11)
        r.font.color.rgb = RGBColor(0x66, 0x66, 0x66)
    elif cmd == "ref":
        p = doc.add_paragraph()
        p.paragraph_format.first_line_indent = Pt(0)
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(text)
        r.font.size = Pt(9); r.font.name = 'Arial'
        r.element.rPr.rFonts.set(qn('w:eastAsia'), 'SimSun')
    elif cmd == "t":
        import json as j2
        rows_data = j2.loads(text)
        headers = rows_data[0]
        rows = rows_data[1:]
        n = len(headers)
        t = doc.add_table(rows=1+len(rows), cols=n)
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        t.style = 'Table Grid'
        # Calc column widths proportionally (total ~14cm)
        cw = [Cm(14/n)] * n
        for i in range(n):
            for r in t.rows:
                r.cells[i].width = cw[i]
        for i, h in enumerate(headers):
            c = t.rows[0].cells[i]
            r = c.paragraphs[0].add_run(h)
            r.bold = True; r.font.size = Pt(9)
            r.font.color.rgb = RGBColor(0xFF,0xFF,0xFF)
            r.font.name = 'Arial'
            r.element.rPr.rFonts.set(qn('w:eastAsia'), 'SimSun')
            c.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
            shd(c, "2E75B6")
        for ri, row in enumerate(rows):
            for ci, ct in enumerate(row):
                c = t.rows[ri+1].cells[ci]
                r = c.paragraphs[0].add_run(str(ct))
                r.font.size = Pt(9); r.font.name = 'Arial'
                r.element.rPr.rFonts.set(qn('w:eastAsia'), 'SimSun')
                if ri % 2 == 0:
                    shd(c, "F2F7FB")

output = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                      '川农智伴技术说明.docx')
doc.save(output)
print(f'OK - 文档已生成: {output}')
print(f'文件大小: {os.path.getsize(output) / 1024:.1f} KB')
