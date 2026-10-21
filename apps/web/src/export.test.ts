import { it, expect } from "vitest";
import { clientDeck } from "./export";
import { data } from "./analytics";

it("labels an explicitly public-source export as historical, never invented fixture records", async () => {
  const s = structuredClone(data["full|all"]);
  // Mock source substitution tests export labelling only; not Google integration proof.
  s.source.id = "google_public_historical";
  s.source.label = "GOOGLE PUBLIC / HISTORICAL";
  const output = (await clientDeck(s, s.decision.action, false)).output();
  expect(output).toContain("HISTORICAL.");
  expect(output).toContain("Obfuscated");
  expect(output).not.toContain("deterministic invented event records");
});

it("exports absent revenue as unavailable rather than zero", async () => {
  const s = structuredClone(data["full|all"]);
  s.metrics = s.metrics.filter((m) => m.metric !== "revenue");
  const output = (await clientDeck(s, s.decision.action, false)).output();
  expect(output).toContain("USD unavailable transaction revenue");
  expect(output).not.toContain("USD 0 transaction revenue");
});
