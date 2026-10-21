import { useEffect, useState } from "react";
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
  useEffect(() => {
    setBaseline(
      s.metrics.find((m) => m.metric === "conversion_rate")?.value ?? 0,
    );
  }, [s.query_id, s.metrics]);
  const [mde, setMde] = useState(10);
  const [creditModel, setCreditModel] = useState("first");
  const [showAttribution, setShowAttribution] = useState(false);
  const [campaign, setCampaign] = useState("all");
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
      <section className="priority-section">
        <span className="eyebrow">
          DIAGNOSTIC PRIORITY / NO UPLIFT FORECAST
        </span>
        <h3>Volume and severity, together.</h3>
        <p>{s.priority_method}</p>
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Scrollable analysis table"
        >
          <table className="intelligence-table">
            <caption>Ranked funnel transitions</caption>
            <thead>
              <tr>
                <th>Transition</th>
                <th>Lost sessions</th>
                <th>Conditional loss</th>
                <th>Priority score</th>
              </tr>
            </thead>
            <tbody>
              {s.priorities.map((p) => (
                <tr key={p.to}>
                  <th scope="row">
                    {p.from} → {p.to}
                  </th>
                  <td>
                    {p.lost} / {p.entrants}
                  </td>
                  <td>
                    {p.loss_pct ?? "Undefined"}
                    {p.loss_pct !== null && "%"}
                  </td>
                  <td>{p.score ?? "Undefined"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted">
          This explicit heuristic ranks investigation, not investment. It does
          not estimate recovery, impact, effort or causality. Tracking QA is a
          prerequisite; a client must supply commercial value and implementation
          cost before funding a test.
        </p>
      </section>
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
          <label>
            Campaign exploration
            <select
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
            >
              <option value="all">All available campaigns</option>
              {[...new Set(s.campaigns.map((c) => c.campaign))].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Scrollable analysis table"
          >
            <table className="intelligence-table">
              <caption>
                Acquisition campaign × channel · synthetic fixture
              </caption>
              <thead>
                <tr>
                  <th>Campaign / channel</th>
                  <th>Sessions / purchases</th>
                  <th>Conversion / 95% interval</th>
                </tr>
              </thead>
              <tbody>
                {s.campaigns
                  .filter((c) => campaign === "all" || c.campaign === campaign)
                  .map((c) => (
                    <tr key={c.campaign + c.channel}>
                      <th scope="row">
                        {c.campaign}
                        <br />
                        {c.channel}
                      </th>
                      <td>
                        {c.sessions} / {c.purchases}
                      </td>
                      <td>
                        {c.conversion.toFixed(2)}%<br />
                        {c.conversion_interval_95?.join("–")}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p className="muted">
            One campaign is present; campaign lift cannot be compared. Wilson
            intervals describe binomial uncertainty under independent-session
            assumptions. Spend, CPA and ROAS are unavailable. No ranking is a
            budget recommendation.
          </p>
          <button
            className="button"
            onClick={() => setShowAttribution(!showAttribution)}
            aria-expanded={showAttribution}
          >
            Compare credit rules on separate synthetic journeys
          </button>
          {showAttribution && (
            <div className="attribution-example">
              <span className="eyebrow">{s.attribution_demo.label}</span>
              <p>{s.attribution_demo.lookback}</p>
              <ol>
                {s.attribution_demo.journeys.map((j) => (
                  <li key={j.id}>
                    {j.id}: {j.touches.join(" → ")} · USD {j.revenue_usd}
                  </li>
                ))}
              </ol>
              <label>
                Attribution rule
                <select
                  value={creditModel}
                  onChange={(e) => setCreditModel(e.target.value)}
                >
                  <option value="first">First touch</option>
                  <option value="last">Last touch</option>
                  <option value="linear">Linear</option>
                </select>
              </label>
              <dl className="credit-rows">
                {Object.entries(
                  s.attribution_demo.credits_usd[creditModel],
                ).map(([channel, value]) => (
                  <div key={channel}>
                    <dt>{channel}</dt>
                    <dd>USD {value.toFixed(2)}</dd>
                  </div>
                ))}
              </dl>
              <p>{s.attribution_demo.limitation}</p>
            </div>
          )}
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
          <p>
            Decision rule to agree before launch: ship only if the two-sided 95%
            interval excludes zero in the beneficial direction and the estimated
            uplift meets the declared MDE; otherwise retain control or call the
            result inconclusive. Pause for broken event delivery, sample-ratio
            mismatch, checkout errors or material revenue/session deterioration.
          </p>
          <p className="muted">
            Randomize by stable consenting visitor to avoid cross-arm
            contamination. The calculator assumes independent sessions; repeat
            visitors require a clustering/design-effect adjustment. Run whole
            weeks until the fixed sample is met, then wait for conversion lag.
            These are design assumptions; no experiment has run.
          </p>
        </div>
      </div>
    </>
  );
}
