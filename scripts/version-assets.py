"""Run after site edits to prevent stale and fresh browser modules being mixed.
The content-based version covers first-party JS/CSS and HTML. No build is needed
by the visitor; commit the generated import and asset URL changes together.
"""
from pathlib import Path
import hashlib
import re

root = Path(__file__).resolve().parent.parent
paths = ['app.js', 'core.js', 'stage2.js', 'pdf.js', 'style.css', 'index.html']
# Normalize previous generated versions before hashing to keep repeated runs stable.
normalized = {p: re.sub(r'\?v=[0-9a-f]{12}', '', (root / p).read_text()) for p in paths}
version = hashlib.sha256(''.join(p + '\n' + normalized[p] for p in paths).encode()).hexdigest()[:12]
for p, text in normalized.items():
    if p.endswith('.js'):
        text = re.sub(r"(from\s+['\"]\./[^'\"?]+\.js)(['\"])", rf'\1?v={version}\2', text)
    elif p == 'index.html':
        text = re.sub(r'((?:src|href)="[^"?#]+\.(?:js|css))(")', rf'\1?v={version}\2', text)
    (root / p).write_text(text)
print(version)
