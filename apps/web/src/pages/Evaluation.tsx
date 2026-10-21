import { useEffect, useState } from "react";
import { Check, Download, ShieldCheck, X, RefreshCw } from "lucide-react";
import type { EvalCase, EvalRun } from "../types";
import { Tag, SectionHead } from "../components/UI";
import { download } from "../export";
export default function Evaluation() {
  const [run, setRun] = useState<EvalRun | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState("v2");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<EvalCase | null>(null);
  async function load() {
    try {
      const r = await fetch("/evidence/fixture-latest.json");
      if (!r.ok) throw new Error("Recorded evaluation unavailable");
      setRun(await r.json());
      setError("");
    } catch (e) {
      setError(String(e));
    }
  }
  useEffect(() => {
    void load();
  }, []);
  const rows =
    run?.results.filter(
      (r) =>
        r.prompt_version === version &&
        (filter === "all" ||
          (filter === "failures" ? !r.passed : r.category === filter)),
    ) || [];
  return (
    <>
      <SectionHead
        number="05"
        title="Trust is a test result."
        detail="Recorded outcomes. Inspectable failures. No invented model grades."
      >
        <button className="button" onClick={() => void load()}>
          <RefreshCw size={15} />
          Reload recorded run
        </button>
      </SectionHead>
      <div className="notice">
        <ShieldCheck size={18} />
        <span>
          DETERMINISTIC FIXTURE EVALUATION · Not live LLM evaluation. The v1/v2
          comparison measures routing and guard policy, not model improvement.
        </span>
      </div>
      {error && <p role="alert">{error}</p>}
      {run && (
        <>
          <div className="evaluation-stats">
            <div>
              <span className="eyebrow">REVISED POLICY / V2</span>
              <strong>
                {run.versions.v2.passed}
                <small>/{run.case_count}</small>
              </strong>
              <span>Cases passed in recorded fixture run</span>
            </div>
            <div>
              <span className="eyebrow">BASELINE POLICY / V1</span>
              <strong>
                {run.versions.v1.passed}
                <small>/{run.case_count}</small>
              </strong>
              <span>Inspect what failed below</span>
            </div>
            <div>
              <span className="eyebrow">LIVE MODEL EVIDENCE</span>
              <strong className="status-word">UNVERIFIED</strong>
              <span>No API credentials · Tokens / cost: unknown</span>
            </div>
          </div>
          <div className="eval-toolbar">
            <div className="tabs">
              {["v2", "v1"].map((v) => (
                <button
                  className={version === v ? "active" : ""}
                  onClick={() => {
                    setVersion(v);
                    setSelected(null);
                  }}
                  key={v}
                >
                  {v === "v2" ? "Revised policy" : "Baseline policy"} · {v}
                </button>
              ))}
            </div>
            <label className="inline-label">
              Show
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All cases</option>
                <option value="failures">Failures only</option>
                {[...new Set(run.results.map((r) => r.category))].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <button
              className="icon-button"
              aria-label="Download evaluation JSON"
              onClick={() =>
                download(
                  "fixture-evaluation.json",
                  JSON.stringify(run, null, 2),
                  "application/json",
                )
              }
            >
              <Download size={18} />
            </button>
          </div>
          <div className="eval-grid">
            <div className="white-panel">
              <div className="eval-heatmap">
                {rows.map((r) => (
                  <button
                    key={r.id}
                    aria-label={`${r.id}: ${r.passed ? "passed" : "failed"}`}
                    className={`${r.passed ? "pass" : "fail"} ${selected?.id === r.id ? "selected" : ""}`}
                    onClick={() => setSelected(r)}
                  >
                    {r.passed ? <Check size={15} /> : <X size={15} />}
                    <span>{r.id}</span>
                  </button>
                ))}
              </div>
              {!rows.length && <p>No cases in this filter.</p>}
              <div className="chart-foot">
                Run: {new Date(run.run_at).toISOString()} · Click a case to
                inspect all grades.
              </div>
            </div>
            <aside className="case-detail">
              {selected ? (
                <>
                  <span className="eyebrow">
                    {selected.category} / {selected.prompt_version}
                  </span>
                  <h3>{selected.question}</h3>
                  <Tag tone={selected.passed ? "" : "red-tag"}>
                    {selected.passed ? "PASSED" : "FAILED"}
                  </Tag>
                  <p>
                    Expected: {selected.expected_status}
                    <br />
                    Actual: {selected.actual_status}
                  </p>
                  {Object.entries(selected.scores).map(([key, value]) => (
                    <div className="grade" key={key}>
                      <span>{key.replaceAll("_", " ")}</span>
                      {value ? <Check size={16} /> : <X size={16} />}
                    </div>
                  ))}
                  <p className="muted">
                    Tool: {selected.actual_tools.join(", ") || "none"}
                    <br />
                    Observed harness time: {selected.elapsed_ms} ms
                    <br />
                    Tokens: {selected.tokens ?? "not applicable"}
                    <br />
                    Cost: {selected.cost_usd ?? "not measured"}
                  </p>
                  {selected.failure_review && (
                    <p className="error">{selected.failure_review}</p>
                  )}
                </>
              ) : (
                <>
                  <ShieldCheck size={26} />
                  <h3>Open the black box.</h3>
                  <p>
                    Select any case. Inspect numerical correctness, evidence
                    linkage, abstention, tool choice and schema validity.
                  </p>
                  <div className="case-note">
                    Failure investigation: v1 routed a ROAS question to channel
                    analysis. V2 rejects unsupported spend questions before a
                    tool call. A live model comparison remains unverified.
                  </div>
                </>
              )}
            </aside>
          </div>
        </>
      )}
    </>
  );
}
