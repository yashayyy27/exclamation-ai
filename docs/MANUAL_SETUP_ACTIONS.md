# ! — owner setup actions

No secret values should be pasted into chat, committed, or placed in VITE_ variables. The offline app works now; these steps unlock external verification.

## 1. Local setup

Use Node 24 LTS and Python 3.12 or newer.

```sh
cd exclamation-ai
npm ci
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements.lock
make check
make eval
npx playwright install chromium
npm run test:e2e
make dev
```

`npm run dev` alone is sufficient for the complete offline browser demo. API: `http://127.0.0.1:8000/health`. Web: `http://127.0.0.1:5173`.

## 2. BigQuery (NOT YET VERIFIED)

Supply an existing owner project with BigQuery API enabled and use BigQuery Sandbox/free quota where suitable. Do not provision paid resources for this portfolio. `roles/bigquery.jobUser` on the query project is sufficient for job creation; public dataset reading uses its public access. Private datasets additionally need only dataset-scoped `roles/bigquery.dataViewer`.

```sh
gcloud auth application-default login
export GOOGLE_CLOUD_PROJECT='YOUR_EXISTING_PROJECT_ID'
export BIGQUERY_MAX_BYTES=1000000000
# Generate an API access token locally, without printing it.
export API_ACCESS_TOKEN="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
make api
```

In another terminal with the same token environment:

```sh
curl --fail -H "Authorization: Bearer $API_ACCESS_TOKEN" 'http://127.0.0.1:8000/analytics?source=bigquery&start=2021-01-01&end=2021-01-01'
```

The adapter rejects a window over the byte cap or 20,000-row completeness limit. Start small. Preserve job_id, dry_run_bytes and comparison evidence, not credentials. No silent fixture fallback occurs. Review public-source acquisition metadata and UTC semantics before interpreting channel results.

## 3. GA4 / GTM (NOT YET VERIFIED)

Follow `docs/gtm-setup.md`. Set `VITE_GTM_ID` locally; restart/build. Verify analytics_storage denied before grant and on revoke, one event per action, correct item values and unique demo transaction IDs. Save real redacted Tag Assistant/DebugView evidence. An owner GA4-to-BigQuery link is a separate future setup; the app does not create it.

## 4. Optional OpenAI (NOT YET VERIFIED)

Store an owner-created project API key in the shell/keychain or a local ignored environment file. Choose a model that supports function calling and strict structured outputs and set `OPENAI_MODEL` explicitly. Configure the API access token above. The app does not automatically load .env files into Python; export them explicitly with your shell's safe method.

```sh
# Set OPENAI_API_KEY securely in this terminal. Never print it.
export OPENAI_MODEL='YOUR_SUPPORTED_MODEL_ID'
make eval-live
```

This makes real API calls and uses owner credits. Run only after setting an owner-approved API budget. Requests are bounded to two model calls per successful attempt, at most two validation attempts. Start with one question via `/ask` before evaluating both prompt versions. No live call has been made by the build agent. Cost remains null unless separately measured; tokens/latency are recorded when returned.

To expose local model mode in the web UI, add `VITE_API_URL=http://127.0.0.1:8000` to ignored `.env.local`, restart Vite, select OpenAI in Ask ! and enter the server access token into the masked field. The token stays in React memory only. Vite root is `apps/web`, so place that file at `apps/web/.env.local`. The template at repository root is a reference, not automatic runtime loading.

## 5. GitHub

The authenticated account is `yashayyy27`. The public repository was created through the authenticated browser after the connector verified ownership and nonexistence. Git publication can use the existing Git credential helper; the commands below are recovery instructions if another environment lacks authentication:

```sh
# Install official GitHub CLI, then authenticate on your own device.
gh auth login --web --git-protocol https
gh repo view yashayyy27/exclamation-ai
# Only if the repository does not exist:
gh repo create exclamation-ai --public --source . --remote github --push --description '! — Evidence-linked marketing intelligence, GA4/GTM measurement and bounded LLM evaluation.'
gh repo edit --add-topic marketing-analytics --add-topic ga4 --add-topic google-tag-manager --add-topic bigquery --add-topic llm --add-topic evaluation --add-topic python --add-topic sql --add-topic portfolio
```

Do not overwrite a repository that already exists. Confirm owner before creating. Set branch protection for main after CI completes; require the CI check and review before merging. Verify `git ls-remote github HEAD` and actual GitHub Actions results. Local test success does not imply hosted CI success.

## 6. Deployment

The verified demo is deployed at https://yashayyy27.github.io/exclamation-ai/ on GitHub Pages. Hosting on another provider is unnecessary. The static build can be reproduced without credentials: `npm run build`, publish `dist/`. The Python service is optional and not hosted with the static demo. GitHub Pages deployment is configured in `.github/workflows/deploy.yml`; only a successful GitHub deployment and reachable page constitute publication. In repository Settings → Pages, choose GitHub Actions as the source. The build sets `DEPLOY_BASE_PATH=/exclamation-ai/` so assets and evaluation JSON resolve under the project path. Do not bind a domain, pay for a plan or deploy external API credentials as part of this demo.

To reproduce on another static host: select Node 24, build `npm ci && npm run build`, publish directory `dist`. Hash navigation works without server rewrites. Keep the demo source as SYNTHETIC / ILLUSTRATIVE and provider as deterministic fixture. Add a model/BigQuery backend only after server authentication, budgets and a live verification pass.
