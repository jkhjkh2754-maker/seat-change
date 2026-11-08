"""Verify the exported cell labels against the final renamed classroom."""
import json
import subprocess
import xml.etree.ElementTree as ET

expected = {s['seat']: ''.join(s['text'].split()) for s in json.load(open('/tmp/names-final.json'))}
ns = {'x': 'http://www.w3.org/1999/xhtml'}
for orientation in ['landscape', 'portrait']:
    root = ET.fromstring(subprocess.check_output(['pdftotext', '-bbox', f'/tmp/names-{orientation}.pdf', '-']))
    pages = root.findall('.//x:page', ns)
    assert len(pages) == 1
    page = pages[0]
    width, height = float(page.attrib['width']), float(page.attrib['height'])
    teacher = orientation == 'portrait'
    groups = {}
    for word in page.findall('x:word', ns):
        a = word.attrib
        x0, y0, x1, y1 = [float(a[k]) for k in ['xMin', 'yMin', 'xMax', 'yMax']]
        assert 0 <= x0 <= x1 <= width and 0 <= y0 <= y1 <= height
        row = int(((y0+y1)/2 - (108 if teacher else 159)) // ((height-210)/6))
        col = int(((x0+x1)/2 - 30) // ((width-60)/6))
        if not (0 <= row < 6 and 0 <= col < 6):
            continue
        key = f'R{6-row if teacher else row+1}C{6-col if teacher else col+1}'
        groups.setdefault(key, []).append((y0, x0, word.text or ''))
    actual = {key: ''.join(text for _, _, text in sorted(parts)) for key, parts in groups.items()}
    assert actual == expected, (orientation, actual, expected)
print('PASS: renamed and unchanged labels match all 36 final seats in both PDFs, including long Korean names, text inside bounds')
