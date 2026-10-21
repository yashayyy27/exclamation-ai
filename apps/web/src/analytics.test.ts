import { describe, it, expect } from "vitest";
import { classify, data, fixtureAsk, sampleSize } from "./analytics";
import golden from "../../../evals/cases/golden.json";
import {
  buildEvent,
  catalog,
  campaignTags,
  validateEvent,
} from "./measurement";
describe("browser policy and Python golden parity", () => {
  for (const c of golden.filter((c) => !c.simulate_failure))
    it(c.id, () => {
      const answer = fixtureAsk(c.question, data["full|all"]);
      expect(answer.status).toBe(c.expected_status);
      expect(classify(c.question).tool).toBe(c.expected_tool);
      if (c.metric)
        expect(
          answer.supporting_metrics.find((m) => m.metric === c.metric)?.value,
        ).toBeCloseTo(c.expected_value!, 4);
    });
  it("filtered scope is real", () => {
    expect(data["first|all"].metrics[0].value).toBe(210);
    expect(data["full|google / cpc"].metrics[0].value).toBe(140);
  });
  it("sample size changes with MDE and rejects impossible inputs", () => {
    expect(sampleSize(15, 10)).toBeGreaterThan(sampleSize(15, 20));
    expect(Number.isNaN(sampleSize(100, 10))).toBe(true);
  });
});
describe("event contract", () => {
  for (const name of [
    "view_item_list",
    "select_item",
    "view_item",
    "add_to_cart",
    "remove_from_cart",
    "begin_checkout",
    "purchase",
  ] as const)
    it(name, () => {
      const e = buildEvent(
        name,
        catalog,
        name === "purchase" ? "demo-test-id" : undefined,
      );
      expect(validateEvent(e)).toEqual([]);
    });
  it("page view schema", () =>
    expect(validateEvent(buildEvent("page_view"))).toEqual([]));
  it("rejects malformed purchase and mismatched value", () => {
    const e = buildEvent("purchase", catalog, "demo-test");
    e.ecommerce!.value = 999;
    delete e.ecommerce!.transaction_id;
    expect(validateEvent(e)).toHaveLength(2);
  });
  it("campaign excludes personal or free-form tags", () =>
    expect(
      campaignTags(
        "?utm_source=google&utm_medium=a@b.com&utm_campaign=fixture-test",
      ),
    ).toEqual({ utm_source: "google", utm_campaign: "fixture-test" }));
});
