PYTHON ?= .venv/bin/python
.PHONY: dev api snapshot test eval eval-live check
api:
	$(PYTHON) -m uvicorn services.api.main:app --host 127.0.0.1 --port 8000
dev:
	@trap 'kill 0' EXIT; $(MAKE) api & npm run dev & wait
snapshot:
	$(PYTHON) scripts/build_snapshot.py
test:
	$(PYTHON) -m pytest -q
	npm test
eval:
	$(PYTHON) evals/run.py
eval-live:
	$(PYTHON) evals/run.py --provider openai
check:
	$(PYTHON) -m ruff check services scripts evals tests
	$(PYTHON) -m mypy services
	npm run lint
	$(MAKE) test
	npm run build
