PYTHON ?= .venv/bin/python
.PHONY: dev api snapshot test eval eval-heldout eval-live check
api:
	$(PYTHON) -m uvicorn services.api.main:app --host 127.0.0.1 --port 8000
dev:
	@$(PYTHON) scripts/dev.py
snapshot:
	$(PYTHON) scripts/build_snapshot.py
test:
	$(PYTHON) -m pytest -q
	npm test
eval:
	$(PYTHON) evals/run.py
eval-heldout:
	$(PYTHON) evals/heldout.py
eval-live:
	$(PYTHON) evals/heldout.py --provider openai --max-requests $(MAX_REQUESTS) $(PAID_APPROVAL)
check:
	$(PYTHON) -m ruff check services scripts evals tests
	$(PYTHON) -m mypy services
	npm run lint
	$(MAKE) test
	npm run build
