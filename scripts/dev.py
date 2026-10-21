"""Run and stop only our child process groups, including Vite's npm wrapper."""

import os
import signal
import subprocess
import sys
import time

children = []
try:
    children.append(
        subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "services.api.main:app", "--host", "127.0.0.1", "--port", "8000"],
            start_new_session=True,
        )
    )
    children.append(subprocess.Popen(["npm", "run", "dev"], start_new_session=True))

    def stop(*_):
        raise KeyboardInterrupt

    signal.signal(signal.SIGTERM, stop)
    while all(p.poll() is None for p in children):
        time.sleep(0.25)
except KeyboardInterrupt:
    pass
finally:
    for child in children:
        try:
            os.killpg(child.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
    for child in children:
        try:
            child.wait(timeout=5)
        except subprocess.TimeoutExpired:
            os.killpg(child.pid, signal.SIGKILL)
            child.wait()
