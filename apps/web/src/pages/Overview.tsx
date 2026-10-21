import {
  ArrowUpRight,
  ArrowRight,
  CircleHelp,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import type { Snapshot } from "../types";
import {
  Tag,
  SourceLine,
  Funnel,
  Trend,
  ChannelTable,
  fmt,
} from "../components/UI";
export default function Overview({
  s,
  go,
}: {
  s: Snapshot;
  go: (x: string) => void;
}) {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="red-tick" /> FROM SIGNAL TO DECISION.
          </span>
          <h1>
            THE SIGNAL
            <br />
            IS THERE.
            <br />
            <span>MAKE IT MATTER.</span>
          </h1>
          <p>
            AI-powered marketing intelligence.
            <br />
            Grounded in evidence. Built for action.
          </p>
          <div className="hero-actions">
            <button
              className="button black"
              onClick={() => go("Measurement Lab")}
            >
              Explore live demo <ArrowUpRight size={17} />
            </button>
            <button
              className="text-button"
              onClick={() => go("Evaluation Studio")}
            >
              See the evidence <ArrowRight size={16} />
            </button>
          </div>
          <span className="hero-note">
            Working interactive demo · Synthetic data · No live model calls
          </span>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-grid" />
          <span className="art-coord">SIGNAL_001 / EVIDENCE FIRST</span>
          <div className="big-stem" />
          <div className="big-dot" />
          <div className="art-label">
            LESS NOISE.
            <br />
            <strong>MORE MEANING.</strong>
          </div>
          <span className="art-bottom">
            01 — 14 JAN 2021 <span>ILLUSTRATIVE</span>
          </span>
        </div>
      </section>
      <SourceLine s={s} />
      <section className="metrics-strip" aria-label="Key performance metrics">
        {[s.metrics[0], s.metrics[1], s.metrics[2], s.metrics[3]].map(
          (m, i) => (
            <div className="kpi" key={m.metric}>
              <span className="eyebrow">
                {
                  [
                    "ELIGIBLE SESSIONS",
                    "PURCHASING SESSIONS",
                    "SESSION CONVERSION",
                    "TRANSACTION REVENUE",
                  ][i]
                }
                <CircleHelp
                  size={13}
                  aria-label={
                    [
                      "Sessions starting in window",
                      "Purchasing sessions in ordered funnel",
                      "Purchasing sessions divided by eligible sessions",
                      "Deduplicated transaction revenue, USD",
                    ][i]
                  }
                />
              </span>
              <strong>
                {i === 3 ? (
                  <>
                    <span className="currency">$</span>
                    {fmt(m.value)}
                  </>
                ) : (
                  fmt(m.value, i === 2 ? 1 : 0)
                )}
                {i === 2 && <span className="unit">%</span>}
              </strong>
              <span className="kpi-caption">
                {
                  [
                    "Closed funnel denominator",
                    "Ordered, within-session",
                    "Descriptive · No causal claim",
                    "USD · No spend or ROAS",
                  ][i]
                }
              </span>
            </div>
          ),
        )}
      </section>
      <section className="decision-band">
        <div className="decision-icon">
          <Sparkles size={20} />
        </div>
        <div>
          <span className="eyebrow">THE PRIORITY SIGNAL</span>
          <h3>
            {fmt(s.decision.lost_sessions)} sessions drop before{" "}
            {s.decision.step?.toLowerCase()}.
          </h3>
          <p>Audit the measurement. Then test a clearer product proposition.</p>
        </div>
        <button
          onClick={() => go("Ask !")}
          className="circle-button"
          aria-label="Investigate the priority signal"
        >
          <ArrowUpRight />
        </button>
        <div className="decision-meta">
          <Tag tone="light">DESCRIPTIVE EVIDENCE</Tag>
          <span>Human review required</span>
        </div>
      </section>
      <div className="analytics-grid">
        <Funnel s={s} />
        <Trend s={s} />
      </div>
      <div className="bottom-grid">
        <section className="channel-panel">
          <div className="chart-title">
            <h3>Where the signal starts</h3>
            <button
              className="text-button"
              onClick={() => go("Customer Journey")}
            >
              Explore journey <ArrowUpRight size={15} />
            </button>
          </div>
          <ChannelTable s={s} />
        </section>
        <section className="pipeline-panel">
          <span className="eyebrow">TRUST IS A PIPELINE.</span>
          <h3>
            Every decision
            <br />
            has a paper trail.
          </h3>
          {[
            "Raw fixture → validated SQL",
            "Registered tools → scoped evidence",
            "Structured output → human review",
          ].map((t) => (
            <div className="pipeline-step" key={t}>
              <CheckCircle2 size={16} />
              {t}
            </div>
          ))}
          <button className="text-button" onClick={() => go("Data Sources")}>
            Inspect the source <ArrowUpRight size={15} />
          </button>
        </section>
      </div>
    </>
  );
}
