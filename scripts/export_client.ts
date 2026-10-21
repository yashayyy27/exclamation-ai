import { writeFileSync, mkdirSync } from "node:fs";
import { clientDeck, summary } from "../apps/web/src/export.ts";
import { readFileSync } from "node:fs";
import type { Snapshot } from "../apps/web/src/types.ts";
const data = JSON.parse(
  readFileSync("apps/web/src/snapshot.json", "utf-8"),
) as Record<string, Snapshot>;
// Documentation artifact remains DRAFT: test automation cannot grant human approval.
const snapshot = data["full|all"];
const pdf = await clientDeck(snapshot, snapshot.decision.action, false);
mkdirSync("docs/deliverables", { recursive: true });
writeFileSync(
  "docs/deliverables/client-review.pdf",
  Buffer.from(pdf.output("arraybuffer")),
);
writeFileSync(
  "docs/deliverables/executive-note.md",
  summary(snapshot, snapshot.decision.action, false),
);
console.log(
  "Generated six-slide draft PDF and executive note; human review remains pending.",
);
