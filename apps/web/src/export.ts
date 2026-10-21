import type { jsPDF as PDF } from "jspdf";
import type { Snapshot } from "./types";
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
    title: "! - Client Review",
    subject: "Synthetic advisory portfolio evidence",
    creator: "!",
  });
  const m = (key: string) =>
    s.metrics.find((x) => x.metric === key)?.value || 0;
  const content = [
    [
      "FROM SIGNAL\nTO DECISION.",
      "Business question",
      "Where should a marketing team investigate friction before committing to an experiment?\n\nObjective: improve ordered purchase-session conversion with evidence and clear measurement.",
    ],
    [
      "KNOW THE\nBOUNDARIES.",
      "Source & scope",
      `${s.source.label}\n${s.window.join(" to ")} | ${s.source.currency} | ${s.source.timezone}\nChannel: ${s.channel}\n\n${s.source.sampling}\n${s.source.obfuscation}\nNot observed client performance.`,
    ],
    [
      "THE NUMBERS.\nDEFINED.",
      "Performance overview",
      `${m("sessions")} eligible sessions\n${m("purchases")} ordered purchasing sessions\n${m("conversion_rate")}% conversion = purchasing sessions / eligible sessions\nUSD ${m("revenue")} deduplicated transaction revenue\n\nClosed funnel; each event must follow its predecessor.`,
    ],
    [
      "FIND THE\nFRICTION.",
      "Ordered journey",
      s.funnel
        .map(
          (f) =>
            `${f.name}: ${f.value} sessions (${f.rate.toFixed(1)}% of eligible)`,
        )
        .join("\n") +
        `\n\nLargest absolute step loss: ${s.decision.lost_sessions} at ${s.decision.step}.\nDrop-off does not establish why it happened.`,
    ],
    [
      "ONE CLEAR\nNEXT MOVE.",
      "Prioritized recommendation",
      recommendation +
        "\n\nAlternative considered: channel budget reallocation. Deferred because no matched spend or causal evidence exists. Human judgment required.",
    ],
    [
      "TEST. LEARN.\nTHEN DECIDE.",
      "Experiment plan",
      "Hypothesis: a clearer product proposition improves ordered conversion.\nPrimary: purchase-session conversion. Guardrails: revenue/session, checkout errors.\nInstrumentation: audit GA4/GTM funnel and unique transactions first.\nOwner: portfolio reviewer. Review date: agree before launch.\nSet sample size and full-week duration before randomization. No uplift promised.",
    ],
  ];
  content.forEach(([title, kicker, body], i) => {
    if (i) pdf.addPage([320, 180], "landscape");
    const dark = i % 2 === 0;
    pdf.setFillColor(dark ? 11 : 245, dark ? 11 : 245, dark ? 13 : 242);
    pdf.rect(0, 0, 320, 180, "F");
    pdf.setTextColor(dark ? 245 : 11, dark ? 245 : 11, dark ? 242 : 13);
    pdf.setFillColor(dark ? 245 : 11, dark ? 245 : 11, dark ? 242 : 13);
    pdf.lines(
      [
        [7, 0],
        [-1.4, 12],
        [-4.2, 0],
        [-1.4, -12],
      ],
      18,
      10,
      [1, 1],
      "F",
      true,
    );
    pdf.setFillColor(239, 41, 41);
    pdf.circle(21.5, 27, 2.1, "F");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(kicker.toUpperCase(), 48, 21);
    pdf.text(`0${i + 1} / 06`, 280, 21);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(32);
    pdf.text(title, 18, 65, { lineHeightFactor: 1.07 });
    pdf.setFillColor(239, 41, 41);
    pdf.rect(18, 100, 38, 2, "F");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(16);
    pdf.text(pdf.splitTextToSize(body, 154), 148, 52, {
      lineHeightFactor: 1.4,
    });
    pdf.setFontSize(8);
    pdf.text(
      `${reviewed ? "HUMAN REVIEWED" : "DRAFT / NOT REVIEWED"} | ${s.source.label} | ${s.window.join(" - ")} | ${s.source.currency} | ${s.source.timezone}`,
      18,
      162,
    );
    pdf.text(
      `! | ${s.query_id} | Independent portfolio; advisory, no observed business outcome.`,
      18,
      169,
    );
  });
  return pdf;
}
