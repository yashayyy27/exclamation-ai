import snapshots from "./snapshot.json";
import type { Answer, Snapshot } from "./types";
export const data = snapshots as unknown as Record<string, Snapshot>;
export const questions = [
  "Show the funnel",
  "Compare channels",
  "Check data quality",
  "Define conversion denominator",
  "Compare periods",
  "Propose an experiment",
];
export function classify(q: string): {
  tool: string | null;
  reason: string | null;
} {
  const s = q.toLowerCase();
  const blocks: [RegExp, string][] = [
    [
      /ignore|system prompt|drop table|execute|override|secret|api.?key|<script|exfiltrat|bypass/,
      "Untrusted instructions cannot change tool permissions.",
    ],
    [
      /roas|\bcpa\b|ad spend|profit|caus|caused|cross.device|identity|incremental|guarantee|forecast|predict|attribution|first.touch|last.touch|linear credit/,
      "No matched spend, causal design, multi-touch identity or predictive evidence is available.",
    ],
    [
      /last month|last week|today|yesterday|2020|2022|2026|eur|aud|denominator unclear|all time/,
      "Clarify a supported source date range, currency and denominator using the filters.",
    ],
    [
      /@|\b\d{9,}\b|phone|email address|customer name/,
      "Personal information is not accepted in analytics questions.",
    ],
    [
      /null-only|missing data|empty dataset|obfuscated identifier/,
      "Available evidence is insufficient for the requested claim.",
    ],
  ];
  for (const [pattern, reason] of blocks)
    if (pattern.test(s)) return { tool: null, reason };
  const rules: [string[], string][] = [
    [["channel", "source", "campaign"], "compare_channels"],
    [["quality", "duplicate", "invalid", "tracking"], "get_data_quality"],
    [
      ["definition", "define", "denominator", "meaning"],
      "get_metric_definition",
    ],
    [["compare period", "week", "trend", "period"], "compare_periods"],
    [
      ["experiment", "sample size", "hypothesis", "test plan"],
      "propose_experiment",
    ],
    [
      [
        "funnel",
        "conversion",
        "checkout",
        "purchase",
        "session",
        "revenue",
        "cart",
        "recommend",
      ],
      "get_funnel",
    ],
  ];
  for (const [words, tool] of rules)
    if (words.some((w) => s.includes(w))) return { tool, reason: null };
  return {
    tool: null,
    reason: "Question is outside the registered analytics intents.",
  };
}
export function fixtureAsk(question: string, snapshot: Snapshot): Answer {
  const { tool, reason } = classify(question);
  if (tool) {
    const answer = structuredClone(snapshot.answers[tool]);
    if (tool === "get_metric_definition") {
      const q = question.toLowerCase();
      const key = q.includes("revenue")
        ? "revenue"
        : q.includes("checkout")
          ? "checkout_completion"
          : q.includes("purchase")
            ? "purchases"
            : q.includes("session") && !q.includes("conversion")
              ? "sessions"
              : "conversion_rate";
      const metric = snapshot.metrics.find((m) => m.metric === key)!;
      answer.supporting_metrics = [structuredClone(metric)];
      answer.trace.evidence_rows = {
        metric: key,
        definition:
          "See the metric dictionary. Units and scopes are preserved in the cited evidence.",
      };
    }
    return answer;
  }
  return {
    question: "Server-scoped analytics question",
    status: "INSUFFICIENT_EVIDENCE",
    finding: reason!,
    supporting_metrics: [],
    caveats: ["Synthetic fixture; no live API call.", "Human review required."],
    recommended_action:
      "Clarify the question or supply independently verified evidence.",
    expected_direction: "No uplift promised.",
    how_to_test: "Validate the missing evidence before proposing a test.",
    confidence_label: "INSUFFICIENT_EVIDENCE",
    needs_human_review: true,
    trace: {
      provider: "fixture",
      prompt_version: "v2",
      tools: [],
      model: null,
      tokens: null,
      cost_usd: null,
      api_calls: 0,
      attempts: 0,
      elapsed_ms: 0,
      execution: "Browser deterministic policy; no model call.",
    },
  };
}
export function sampleSize(baseline: number, relativeMde: number): number {
  const p = baseline / 100,
    delta = (p * relativeMde) / 100;
  if (p <= 0 || p >= 1 || delta <= 0 || p + delta >= 1) return NaN;
  return Math.ceil(
    (2 * Math.pow(1.96 + 0.8416, 2) * p * (1 - p)) / (delta * delta),
  );
}
