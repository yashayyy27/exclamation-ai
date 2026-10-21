import { useState } from "react";
import { CircleHelp } from "lucide-react";
import type { Snapshot } from "../types";
import {
  SectionHead,
  SourceLine,
  Funnel,
  ChannelTable,
  fmt,
} from "../components/UI";
import { sampleSize } from "../analytics";
export default function Journey({ s }: { s: Snapshot }) {
  const [baseline, setBaseline] = useState(s.metrics[2].value);
  const [mde, setMde] = useState(10);
  const n = sampleSize(baseline, mde);
  return (
    <>
      <SectionHead
        number="03"
        title="Follow the evidence."
        detail="Ordered journeys, honest attribution and a testable next step."
      />
      <SourceLine s={s} />
      <Funnel s={s} expanded />
      <div className="bottom-grid">
        <div className="white-panel">
          <span className="eyebrow">DESCRIPTIVE SOURCE PERFORMANCE</span>
          <h3>Credit is not causality.</h3>
          <ChannelTable s={s} />
          <div className="notice">
            <CircleHelp size={18} />
            <span>
              {s.attribution.status}: {s.attribution.reason}
            </span>
          </div>
          <p className="muted">
            First-touch, last-touch and linear attribution require observed
            touchpoints in a declared lookback window. None are fabricated here.
            Public GA4 traffic_source is acquisition metadata; it is not a
            session attribution model.
          </p>
        </div>
        <div className="experiment-panel">
          <span className="eyebrow">TEST & LEARN</span>
          <h3>Design the next move.</h3>
          <p>
            Hypothesis: a clearer product proposition improves ordered
            conversion.
          </p>
          <label>
            Baseline conversion (%)
            <input
              type="number"
              min="0.1"
              max="99"
              step="0.1"
              value={baseline}
              onChange={(e) => setBaseline(Number(e.target.value))}
            />
          </label>
          <label>
            Minimum relative uplift (%)
            <input
              type="number"
              min="1"
              max="100"
              value={mde}
              onChange={(e) => setMde(Number(e.target.value))}
            />
          </label>
          <div className="sample-result">
            <strong>{Number.isFinite(n) ? fmt(n) : "—"}</strong>
            <span>sessions per arm</span>
          </div>
          <p className="muted">
            Approximate two-sided proportions test · 95% confidence · 80% power
            · equal arms · fixed horizon. No peeking adjustment, clustering or
            multiple-testing correction.
          </p>
          <p>
            Primary: purchase-session conversion. Guardrails: revenue/session
            and checkout errors. Owner and review date must be agreed before
            launch.
          </p>
        </div>
      </div>
    </>
  );
}
