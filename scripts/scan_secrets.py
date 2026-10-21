"""Conservative repository scan, not a guarantee against every secret format."""

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
result = subprocess.run(["git", "ls-files", "-z"], cwd=ROOT, capture_output=True, check=True)
paths = [ROOT / p for p in result.stdout.decode().split("\0") if p]
patterns = [
    re.compile(x)
    for x in [
        r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
        r"gh[pousr]_[A-Za-z0-9]{30,}",
        r"github_pat_[A-Za-z0-9_]{40,}",
        r"sk-(?:proj-)?[A-Za-z0-9_-]{32,}",
        r"AIza[A-Za-z0-9_-]{30,}",
        r'"private_key"\s*:\s*"-----',
    ]
]
problems = []
for path in paths:
    name = path.name.lower()
    if (
        (name.startswith(".env") and name != ".env.example")
        or name.endswith(".pem")
        or ("service-account" in name and name.endswith(".json"))
    ):
        problems.append(str(path.relative_to(ROOT)) + ": forbidden secret filename")
    if path.suffix.lower() in {".png", ".jpg", ".jpeg", ".pdf", ".woff", ".woff2"}:
        continue
    try:
        text = path.read_text()
    except (UnicodeDecodeError, IsADirectoryError):
        continue
    if any(p.search(text) for p in patterns):
        problems.append(str(path.relative_to(ROOT)) + ": secret-like content")
if problems:
    print("\n".join(problems))
    sys.exit(1)
print(f"Secret pattern and forbidden-path scan passed: {len(paths)} tracked files. No secret values printed.")
