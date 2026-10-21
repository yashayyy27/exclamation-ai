"""Check relative Markdown links without transmitting repository contents."""

import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
errors = []
for p in [root / "README.md", *root.glob("docs/*.md")]:
    if not p.exists():
        continue
    for link in re.findall(r"\]\(([^)]+)\)", p.read_text()):
        if "://" in link or link.startswith("#"):
            continue
        target = link.split("#")[0]
        if target and not (p.parent / target).exists():
            errors.append(f"{p.relative_to(root)}: {link}")
if errors:
    print("\n".join(errors))
    sys.exit(1)
print("Relative Markdown links verified")
