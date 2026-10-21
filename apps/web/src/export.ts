import type { jsPDF as PDF } from "jspdf";
import type { Snapshot } from "./types";
import { sampleSize } from "./experiment.ts";
export function download(name: string, content: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function summary(
  s: Snapshot,
  recommendation: string,
  reviewed: boolean,
): string {
  return `# ! — FROM SIGNAL TO DECISION.\n\n${reviewed ? "HUMAN REVIEWED — advisory portfolio report" : "DRAFT — NOT REVIEWED"}\n\nSource: ${s.source.label} (${s.source.id})\nScope: ${s.window.join(" to ")} · ${s.source.currency} · ${s.source.timezone}\nChannel: ${s.channel}\n${s.source.sampling}\n${s.source.obfuscation}\nQuery: ${s.query_id}\n\n## Decision\n${recommendation}\n\n## Evidence\n${s.metrics.map((m) => `${m.metric}: ${m.value} ${m.unit} [${m.query_id}]`).join("\n")}\n\n## Limitation\n${s.decision.caveat}\n\n## Test plan\nOwner: portfolio reviewer. Audit tracking, randomize product-page proposition, primary ordered purchase-session conversion; guardrails revenue/session and checkout errors. Agree sample size and a review date before launch. No experiment has run.\n\nIndependent portfolio project. No affiliation or business outcome claimed.\n`;
}
export async function clientDeck(
  s: Snapshot,
  recommendation: string,
  reviewed: boolean,
): Promise<PDF> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [320, 180],
  });
  pdf.setProperties({
    title: "! - Evidence before investment",
    subject: `Advisory portfolio / ${s.source.label}`,
    creator: "!",
  });
  const ink = [11, 11, 13] as const,
    paper = [245, 245, 242] as const,
    red = [239, 41, 41] as const;
  let dark = true;
  const safe = (value: string) => {
    const text = value
      .replace(/[–—→]/g, " - ")
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/×/g, "x")
      .replace(/·/g, "|")
      .replace(/…/g, "...");
    if (/[^\x20-\x7e\n\r]/.test(text))
      throw new Error(
        "PDF supports ASCII text and common punctuation. Use the Markdown export to preserve other characters.",
      );
    return text;
  };
  const text = (
    value: string,
    x: number,
    y: number,
    size = 17,
    width = 280,
    bold = false,
  ) => {
    pdf.setTextColor(
      dark ? paper[0] : ink[0],
      dark ? paper[1] : ink[1],
      dark ? paper[2] : ink[2],
    );
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(safe(value), width) as string[];
    const height = lines.length * size * 0.3528 * 1.15;
    if (y + height > 154)
      throw new Error(
        "Text exceeds the six-slide layout. Shorten the recommendation before exporting.",
      );
    pdf.text(lines, x, y, { lineHeightFactor: 1.15 });
  };
  const page = (i: number, label: string, isDark: boolean) => {
    if (i > 1) pdf.addPage([320, 180], "landscape");
    dark = isDark;
    pdf.setFillColor(
      dark ? ink[0] : paper[0],
      dark ? ink[1] : paper[1],
      dark ? ink[2] : paper[2],
    );
    pdf.rect(0, 0, 320, 180, "F");
    text("!", 16, 25, 37, 20, true);
    text(label.toUpperCase(), 34, 19, 10);
    text(`0${i} / 06`, 281, 19, 10, 28);
    pdf.setDrawColor(...red);
    pdf.setLineWidth(0.6);
    pdf.line(16, 30, 304, 30);
    pdf.setTextColor(
      dark ? paper[0] : ink[0],
      dark ? paper[1] : ink[1],
      dark ? paper[2] : ink[2],
    );
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(
      `${reviewed ? "LOCAL REVIEW CHECKED" : "DRAFT / NOT REVIEWED"} | ${s.source.label} | ${s.window.join(" - ")} | USD / UTC`,
      16,
      165,
    );
    pdf.text(
      `! | ${s.query_id} | Independent portfolio. No client performance or business outcome claimed.`,
      16,
      172,
    );
  };
  const m = (key: string) => s.metrics.find((x) => x.metric === key)?.value;
  const abs = s.priorities.reduce((a, b) => (b.lost > a.lost ? b : a));
  const prop = s.priorities.reduce((a, b) =>
    (b.loss_pct ?? -1) > (a.loss_pct ?? -1) ? b : a,
  );
  const baseline = m("conversion_rate");
  const n = baseline === undefined ? NaN : sampleSize(baseline, 10);
  page(1, "The business question", true);
  text("EVIDENCE\nBEFORE\nINVESTMENT", 16, 56, 57, 205, true);
  text(
    "Where should we investigate conversion friction before committing budget?",
    222,
    53,
    24,
    80,
    true,
  );
  text(
    "Decision requested: authorize instrumentation QA and a focused diagnosis. A growth claim needs an experiment.",
    222,
    106,
    16,
    80,
  );
  page(2, "Provenance + performance", false);
  text(
    s.source.id === "synthetic_fixture_v1"
      ? "SYNTHETIC.\nEXPLICITLY."
      : "PUBLIC.\nHISTORICAL.",
    16,
    55,
    46,
    145,
    true,
  );
  text(
    `${s.window.join(" to ")}\nScope: ${s.channel}\nClosed, ordered session funnel. USD revenue is deduplicated by transaction.`,
    16,
    106,
    17,
    132,
  );
  text("ELIGIBLE SESSIONS", 170, 46, 10, 130);
  text(String(m("sessions") ?? "Unavailable"), 170, 69, 47, 130, true);
  text(
    `${m("purchases") ?? "Unavailable"} ordered purchasers / ${m("conversion_rate") ?? "Undefined"}% conversion`,
    170,
    87,
    19,
    132,
    true,
  );
  text(
    `USD ${m("revenue") ?? "unavailable"} transaction revenue`,
    170,
    102,
    19,
    132,
  );
  text(
    s.source.id === "synthetic_fixture_v1"
      ? "Source: deterministic invented event records. No Google extract or observed client result. No matched spend, touchpoint history or causal design."
      : "Source: Google public historical export. Obfuscated records have limited internal consistency. No matched spend, touchpoint history or causal design. Not client performance.",
    170,
    122,
    15,
    132,
  );
  page(3, "Funnel diagnosis", true);

  // Counts and denominators remain native vector/text objects in every export.
  const top = s.funnel[0].value || 1;
  s.funnel.forEach((f, i) => {
    const y = 65 + i * 15;
    text(f.name, 16, y, 15, 65);
    pdf.setFillColor(...red);
    pdf.rect(84, y - 5, (120 * f.value) / top, 6, "F");
    text(`${f.value} / ${s.funnel[0].value}`, 211, y, 16, 90, true);
  });
  // Dynamic scope text supersedes the illustrative headline above.
  pdf.setFillColor(...ink);
  pdf.rect(15, 34, 290, 20, "F");
  text(
    `${abs.lost} lost at ${abs.to.toLowerCase()}; ${prop.loss_pct ?? "undefined"}% at ${prop.to.toLowerCase()}`,
    16,
    47,
    26,
    288,
    true,
  );
  text(
    "Largest absolute loss and largest proportional loss can point to different transitions. Neither establishes why people left.",
    16,
    145,
    14,
    288,
  );
  page(4, "Competing explanations", false);
  text(
    "COUNTS LOCATE A QUESTION.\nTHEY DO NOT EXPLAIN IT.",
    16,
    53,
    35,
    288,
    true,
  );
  const hypotheses = [
    [
      "01 / RELEVANCE",
      "Visitors may not see enough value.",
      "Need: product research and message testing. Funnel counts alone cannot establish intent.",
    ],
    [
      "02 / FRICTION",
      "The interaction may be difficult.",
      "Need: consented usability evidence and device/error breakdown. No such evidence is available.",
    ],
    [
      "03 / COLLECTION",
      "Events may be missing or duplicated.",
      "Need: Tag Assistant, GA4 DebugView and transaction reconciliation before interpreting the loss.",
    ],
  ];
  hypotheses.forEach(([label, hypothesis, need], i) => {
    const x = 16 + i * 98;
    text(label, x, 98, 12, 90, true);
    text(hypothesis, x, 112, 19, 90, true);
    text(need, x, 134, 13, 90);
  });
  page(5, "One prioritised recommendation", true);
  text("DIAGNOSE THE\nTOP TRANSITION", 16, 54, 42, 288, true);
  text(recommendation, 16, 99, 18, 190, true);
  text(
    `Priority 1: ${s.priorities[0].from} to ${s.priorities[0].to}\n${s.priorities[0].lost} lost x ${(Number(s.priorities[0].loss_pct) / 100).toFixed(4)} loss fraction\nScore ${s.priorities[0].score} (heuristic)`,
    222,
    88,
    16,
    80,
  );
  text(
    "Gate: verify event delivery first. Defer channel budget reallocation: spend and incremental effects are unavailable.",
    222,
    122,
    14,
    80,
  );
  page(6, "Experiment + decision criteria", false);
  text("AGREE THE RULE\nBEFORE THE RESULT", 16, 53, 40, 288, true);
  text(
    "Hypothesis: a clearer product proposition improves purchase-session conversion. Confirm with research before choosing a variant.",
    16,
    96,
    18,
    138,
    true,
  );
  text(
    `50/50 allocation | baseline ${baseline ?? "undefined"}%\n10% relative MDE | alpha .05 | 80% power\nApprox. ${Number.isFinite(n) ? n.toLocaleString("en-US") : "undefined"} independent sessions per arm`,
    16,
    125,
    16,
    138,
  );
  text("SHIP", 170, 93, 12, 130, true);
  text(
    "Only if the 95% interval is positive, estimated uplift meets MDE and guardrails pass. Otherwise retain control or declare inconclusive.",
    170,
    104,
    16,
    132,
  );
  text("PAUSE / OWNERSHIP", 170, 129, 12, 132, true);
  text(
    "Pause for broken delivery, sample-ratio mismatch, checkout errors or material revenue/session harm. Agree owner, thresholds, clustering, whole-week duration and conversion lag before launch.",
    170,
    139,
    12,
    132,
  );
  return pdf;
}
