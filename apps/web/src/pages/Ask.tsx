import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight, CircleHelp, ShieldCheck, Plus } from "lucide-react";
import type { Answer, Snapshot } from "../types";
import { Mark, Tag, SectionHead, SourceLine, Evidence } from "../components/UI";
import { fixtureAsk, questions } from "../analytics";
export default function Ask({ s }: { s: Snapshot }) {
  const [q, setQ] = useState("Where is the funnel opportunity?");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("fixture");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const prev = useRef(s.query_id);
  useEffect(() => {
    if (prev.current !== s.query_id) {
      setAnswer(null);
      prev.current = s.query_id;
    }
  }, [s.query_id]);
  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (q.trim().length < 3 || q.length > 500)
        throw new Error("Use a question between 3 and 500 characters.");
      if (mode === "openai") {
        const url = import.meta.env.VITE_API_URL;
        if (!url)
          throw new Error(
            "Local API URL is not configured. Use the deterministic fixture workflow.",
          );
        const res = await fetch(`${url}/ask`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question: q,
            start: s.window[0],
            end: s.window[1],
            channel: s.channel,
            source: "fixture",
            provider: "openai",
          }),
        });
        if (!res.ok)
          throw new Error(
            `API returned ${res.status}; no fallback answer displayed.`,
          );
        setAnswer(await res.json());
      } else setAnswer(fixtureAsk(q, s));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      setAnswer(null);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <SectionHead
        number="04"
        title="Ask a better question."
        detail="A bounded path from a question to evidence. Every recommendation is reviewable."
      />
      <SourceLine s={s} />
      <div className="ask-layout">
        <div className="ask-main">
          <div className="ask-intro">
            <Mark />
            <div>
              <h3>Insight has to earn its confidence.</h3>
              <p>
                Ask about the funnel, channels, metric definitions, quality,
                periods or an experiment. Unsupported claims trigger abstention.
              </p>
            </div>
          </div>
          <form onSubmit={submit}>
            <label htmlFor="question" className="eyebrow">
              YOUR ANALYTICS QUESTION
            </label>
            <textarea
              id="question"
              value={q}
              maxLength={500}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="ask-form-bottom">
              <span>
                <ShieldCheck size={14} />
                No arbitrary SQL. No personal data.
              </span>
              <button className="button black" disabled={busy}>
                {busy ? "Verifying…" : "Find the signal"}{" "}
                <ArrowUpRight size={16} />
              </button>
            </div>
          </form>
          <div className="question-chips">
            {questions.map((t) => (
              <button key={t} onClick={() => setQ(t)}>
                {t}
                <Plus size={12} />
              </button>
            ))}
            <button onClick={() => setQ("Calculate ROAS by channel")}>
              Try an unsupported claim
              <ShieldCheck size={12} />
            </button>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {answer && (
            <article className="answer" aria-live="polite">
              <Tag tone={answer.status === "SUPPORTED" ? "" : "red-tag"}>
                {answer.status.replaceAll("_", " ")}
              </Tag>
              <h3>{answer.finding}</h3>
              {answer.supporting_metrics.length > 0 && (
                <Evidence s={s} metrics={answer.supporting_metrics} />
              )}
              <span className="eyebrow">RECOMMENDED ACTION</span>
              <p className="recommendation">{answer.recommended_action}</p>
              <div className="answer-caveats">
                {answer.caveats.map((c) => (
                  <p key={c}>
                    <CircleHelp size={15} />
                    {c}
                  </p>
                ))}
              </div>
              <details>
                <summary>Inspect tool output & audit trace</summary>
                <pre>{JSON.stringify(answer.trace, null, 2)}</pre>
              </details>
            </article>
          )}
        </div>
        <aside className="ask-aside">
          <span className="eyebrow">THE EVIDENCE CONTRACT</span>
          <h3>
            Nothing
            <br />
            unearned.
          </h3>
          {[
            "Scope the question",
            "Call an approved tool",
            "Calculate in SQL / Python",
            "Validate evidence exactly",
            "Return advice for review",
          ].map((x, i) => (
            <div className="trace-step" key={x}>
              <span>0{i + 1}</span>
              {x}
            </div>
          ))}
          <label>
            Provider
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                setAnswer(null);
              }}
            >
              <option value="fixture">Deterministic fixture (no LLM)</option>
              <option value="openai" disabled={!import.meta.env.VITE_API_URL}>
                OpenAI via local API{" "}
                {import.meta.env.VITE_API_URL ? "" : "— not configured"}
              </option>
            </select>
          </label>
          {mode === "openai" && (
            <label>
              Server access token
              <input
                type="password"
                autoComplete="off"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </label>
          )}
          <p className="muted">
            Fixture answers are precomputed by the Python evidence pipeline and
            checked in. No model tokens, model latency or model scores are
            claimed.
          </p>
        </aside>
      </div>
    </>
  );
}
