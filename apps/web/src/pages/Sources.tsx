import { Download, Sparkles, Database, Activity } from "lucide-react";
import type { Snapshot } from "../types";
import { Tag, SectionHead, Evidence } from "../components/UI";
import { download } from "../export";
export default function Sources({ s }: { s: Snapshot }) {
  return (
    <>
      <SectionHead
        number="07"
        title="Know where you stand."
        detail="Connection state is a fact, not a marketing claim."
      />
      <div className="source-cards">
        {[
          {
            title: "Deterministic fixture",
            tag: "AVAILABLE",
            body: "Raw synthetic ecommerce events transformed by Python + SQL. Checked-in snapshots power the public demo.",
            icon: Database,
          },
          {
            title: "Google public BigQuery",
            tag: "CONSOLE VERIFIED",
            body: "One historical UTC day: 22,096 real public events, nine local/GoogleSQL checks matched. SDK authentication remains unverified. Dashboard metrics remain synthetic.",
            href: "https://github.com/yashayyy27/exclamation-ai/blob/main/docs/bigquery-analysis-2026-10-25.md",
            linkLabel: "Inspect actual jobs and analysis",
            icon: Database,
          },
          {
            title: "GA4 / GTM sandbox",
            tag: "LOCAL PREVIEW VERIFIED",
            body:
              "All eight demo event types received in the owner's GA4 DebugView on 26 Oct 2026, including two distinct test purchases. " +
              (import.meta.env.VITE_GTM_ID
                ? "This build has GTM configured; delivery requires consent and a working container."
                : "Tracking is disabled in this public build. Dashboard metrics remain synthetic."),
            href: "https://github.com/yashayyy27/exclamation-ai/blob/main/docs/google-tracking-2026-10-26.md",
            linkLabel: "Inspect genuine tracking evidence",
            icon: Activity,
          },
          {
            title: "OpenAI Responses",
            tag: "NOT VERIFIED",
            body: "Bounded tool calling and structured output provider implemented server-side. No actual model calls recorded. Configure API key, model and API access token locally.",
            icon: Sparkles,
          },
        ].map((c) => (
          <article className="source-card" key={c.title}>
            <c.icon size={24} />
            <Tag>{c.tag}</Tag>
            <h3>{c.title}</h3>
            <p>{c.body}</p>
            {c.href && (
              <a href={c.href} target="_blank" rel="noreferrer">
                {c.linkLabel}
              </a>
            )}
          </article>
        ))}
      </div>
      <div className="bottom-grid">
        <div className="white-panel">
          <span className="eyebrow">PROVENANCE / {s.source.id}</span>
          <h3>Context travels with every number.</h3>
          <dl>
            {Object.entries(s.source).map(([k, v]) => (
              <div key={k}>
                <dt>{k.replaceAll("_", " ")}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="white-panel">
          <span className="eyebrow">QUALITY / COMPLETE RAW FIXTURE</span>
          <h3>Messy in. Accountable out.</h3>
          {Object.entries(s.quality).map(([k, v]) => (
            <div className="quality-row" key={k}>
              <span>{k.replaceAll("_", " ")}</span>
              <strong>{v}</strong>
            </div>
          ))}
          <p className="muted">
            Quality counts cover the complete fixture, regardless of active
            analytics filters. One invalid record has both a missing identifier
            and negative revenue; those issue counts overlap.
          </p>
          <button
            className="button"
            onClick={() =>
              download(
                "scoped-evidence.json",
                JSON.stringify({ ...s, answers: undefined }, null, 2),
                "application/json",
              )
            }
          >
            <Download size={16} />
            Download scoped evidence
          </button>
        </div>
      </div>
      <Evidence s={s} />
    </>
  );
}
