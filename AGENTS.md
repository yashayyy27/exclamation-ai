# ! project guidelines
- Display product name as !. Keep synthetic, public historical and first-party demo data separate.
- Never expose secrets or call a paid integration by default.
- Run `make check`, `make eval`, `npm run test:e2e` before release. Record observed results only.
- `make dev` starts API + web. `npm run dev` starts credential-free web only.
- Only registered read-only query templates. Validate all model evidence and require report review.
- Do not turn deterministic fixture scores into model quality claims.
