import { useEffect, useState } from "react";
import { Download, Presentation } from "lucide-react";
import type { Snapshot } from "../types";
import { Mark, Tag, SectionHead, SourceLine } from "../components/UI";
import { clientDeck, download, summary } from "../export";
export default function Client({ s }: { s: Snapshot }) {
  const [text, setText] = useState(s.decision.action);
  const [reviewed, setReviewed] = useState(false);
  const [exportError, setExportError] = useState("");
  useEffect(() => {
    setText(s.decision.action);
    setReviewed(false);
  }, [s.query_id]);
  return (
    <>
      <SectionHead
        number="06"
        title="Make the next move clear."
        detail="One decision. Defensible evidence. A conversation a client can act on."
      />
      <SourceLine s={s} />
      <div className="client-layout">
        <article className="client-paper">
          <div className="paper-top">
            <Mark />
            <span>CLIENT REVIEW / INDEPENDENT PORTFOLIO</span>
            <Tag>{reviewed ? "HUMAN REVIEWED" : "DRAFT · REVIEW REQUIRED"}</Tag>
          </div>
          <span className="eyebrow">EXECUTIVE DECISION NOTE</span>
          <h2>
            Clarity before
            <br />
            commitment.
          </h2>
          <p className="client-lead">{s.decision.action}</p>
          <div className="paper-metrics">
            <div>
              <strong>{s.metrics[2].value}%</strong>
              <span>ordered session conversion</span>
            </div>
            <div>
              <strong>{s.decision.lost_sessions}</strong>
              <span>sessions lost before {s.decision.step?.toLowerCase()}</span>
            </div>
          </div>
          <label htmlFor="recommendation" className="eyebrow">
            ONE PRIORITIZED RECOMMENDATION · EDIT BEFORE REVIEW
          </label>
          <textarea
            id="recommendation"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setReviewed(false);
            }}
            maxLength={650}
          />
          <div className="paper-sections">
            <div>
              <h4>What the evidence supports</h4>
              <p>
                A reproducible, ordered funnel locates a transition worth
                investigating. All counts come from validated fixture events.
              </p>
            </div>
            <div>
              <h4>What it cannot tell us</h4>
              <p>
                {s.decision.caveat} No matched spend, real-world uplift or
                causal impact is established.
              </p>
            </div>
            <div>
              <h4>The test & the decision</h4>
              <p>
                Audit tracking, then randomize a product proposition. Primary:
                ordered conversion. Guardrails: revenue/session, checkout
                errors. Owner: portfolio reviewer. Agree a review date before
                launch.
              </p>
            </div>
            <div>
              <h4>Alternative considered</h4>
              <p>
                Product relevance, interaction friction and missing tracking can
                each explain the observed loss. Funnel counts do not separate
                them. Validate delivery, then collect usability evidence before
                selecting a variant. Channel budget reallocation needs matched
                spend and causal evidence.
              </p>
            </div>
          </div>
          <footer>
            {s.query_id} · {s.window.join(" → ")} · USD / UTC
            <br />
            {s.source.sampling}
          </footer>
        </article>
        <aside className="client-controls">
          <span className="eyebrow">THE HUMAN CHECKPOINT</span>
          <h3>
            Advice needs
            <br />
            an owner.
          </h3>
          <p>
            Review the recommendation, source, metric definitions and
            limitations before labelling this advisory report reviewed.
          </p>
          <label className="check-label">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
            />
            I have reviewed this recommendation and its supporting evidence.
          </label>
          <button
            className="button black"
            disabled={!reviewed || !text.trim()}
            onClick={() =>
              download(
                "decision-note.md",
                summary(s, text, reviewed),
                "text/markdown",
              )
            }
          >
            <Download size={17} />
            Export executive note
          </button>
          <button
            className="button"
            disabled={!reviewed || !text.trim()}
            onClick={async () => {
              try {
                setExportError("");
                (await clientDeck(s, text, reviewed)).save("client-review.pdf");
              } catch (error) {
                setExportError(
                  error instanceof Error
                    ? error.message
                    : "PDF export failed. Try again.",
                );
              }
            }}
          >
            <Presentation size={17} />
            Download 6-slide PDF
          </button>
          {exportError && <p role="alert">{exportError}</p>}
          <div className="six-slides">
            <span className="eyebrow">THE CLIENT STORY / 6 SLIDES</span>
            {[
              "Business question",
              "Provenance & performance",
              "Funnel diagnosis",
              "Competing explanations",
              "One next move",
              "Test & learn",
            ].map((x, i) => (
              <div key={x}>
                <span>0{i + 1}</span>
                {x}
              </div>
            ))}
          </div>
          <p className="muted">
            An exported review flag records a local human checkpoint. It is not
            a signed approval system. Editing or changing the scope resets
            review.
          </p>
        </aside>
      </div>
    </>
  );
}
