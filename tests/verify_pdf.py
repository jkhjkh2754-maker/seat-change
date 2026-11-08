"""Check actual exported text positions against the final browser seating snapshot.
Run after node tests/pdf.mjs. Requires Poppler's pdftotext.
"""
import json
import re
import subprocess
import xml.etree.ElementTree as ET

expected = json.load(open('/tmp/pdf-final.json'))
expected_students = {seat['text']: seat['seat'] for seat in expected if re.fullmatch(r'\d+', seat['text'])}
ns = {'x': 'http://www.w3.org/1999/xhtml'}

def pages(path):
    xml = subprocess.check_output(['pdftotext', '-bbox', path, '-'])
    root = ET.fromstring(xml)
    result = []
    for page in root.findall('.//x:page', ns):
        width, height = float(page.attrib['width']), float(page.attrib['height'])
        words = []
        for word in page.findall('x:word', ns):
            a = word.attrib
            box = [float(a[k]) for k in ['xMin', 'yMin', 'xMax', 'yMax']]
            assert 0 <= box[0] < box[2] <= width, (path, word.text, box)
            assert 0 <= box[1] < box[3] <= height, (path, word.text, box)
            words.append((word.text, box))
        result.append(words)
    return result

for path in ['/tmp/seats-landscape.pdf', '/tmp/seats-portrait.pdf']:
    pp = pages(path)
    assert len(pp) == 1
    words = pp[0]
    teacher = 'portrait' in path
    width, height = (595.28, 841.89) if teacher else (841.89, 595.28)
    numbers = [(text, box) for text, box in words if re.fullmatch(r'\d+', text)]
    assert len(numbers) == len(expected_students) == 3
    assert set(text for text, _ in numbers) == set(expected_students)
    assert not any(re.fullmatch(r'R\d+C\d+', text) for text, _ in words)
    assert not any('김하늘' in text or '긴이름' in text for text, _ in words)
    for student, box in numbers:
        center_x = (box[0] + box[2]) / 2
        center_y = (box[1] + box[3]) / 2
        col = int((center_x - 30) / ((width - 60) / 6))
        row = int((center_y - (108 if teacher else 159)) / ((height - 210) / 6))
        actual = f'R{6-row if teacher else row+1}C{6-col if teacher else col+1}'
        assert actual == expected_students[student], (path, student, actual, expected_students[student])

split = pages('/tmp/seats-split.pdf')
assert len(split) == 2
labels = [text for words in split for text, _ in words if text in ['빈자리', '제외'] or re.fullmatch(r'\d+', text)]
assert len(labels) == 120
assert sorted(text for text in labels if re.fullmatch(r'\d+', text)) == ['001', '002', '003']
print('PASS: number-only PDF labels match final seats in both views, no names or seat IDs, text inside page bounds, 120 seat labels across split pages')
