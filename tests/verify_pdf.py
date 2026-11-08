"""Check actual exported text positions against the final browser seating snapshot.
Run after node tests/pdf.mjs. Requires Poppler's pdftotext.
"""
import json
import re
import subprocess
import xml.etree.ElementTree as ET

expected = json.load(open('/tmp/pdf-final.json'))
expected_students = {seat['text'].split(' · ')[0]: seat['seat'] for seat in expected if ' · ' in seat['text']}
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
    keys = [(text, box) for text, box in words if re.fullmatch(r'R\d+C\d+', text)]
    assert len(keys) == 36
    for student, expected_seat in expected_students.items():
        matches = [box for text, box in words if text == student]
        assert len(matches) == 1, (path, student, matches)
        box = matches[0]
        # The seat ID is below its name. Pick the next ID row and nearest column.
        below = [(text, b) for text, b in keys if b[1] > box[1]]
        next_y = min(b[1] for _, b in below)
        row = [(text, b) for text, b in below if abs(b[1] - next_y) < 1]
        actual = min(row, key=lambda pair: abs(sum(pair[1][::2])/2 - sum(box[::2])/2))[0]
        assert actual == expected_seat, (path, student, actual, expected_seat)

split = pages('/tmp/seats-split.pdf')
assert len(split) == 2
keys = [text for words in split for text, _ in words if re.fullmatch(r'R\d+C\d+', text)]
assert len(keys) == len(set(keys)) == 120
assert set(keys) == {f'R{r}C{c}' for r in range(1, 13) for c in range(1, 11)}
print('PASS: PDF student/seat identity in both views, text inside page bounds, 120 unique seats across split pages')
