import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Snapshot } from "../types";
export const fmt = (n: number, d = 0) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: d }).format(n);
export function Mark({ large = false }: { large?: boolean }) {
  return (
    <svg
      role="img"
      aria-label="! — Marketing Intelligence"
      className={large ? "mark large" : "mark"}
      viewBox="0 0 40 56"
    >
      <path d="M8 2h25l-5 36H13z" fill="currentColor" />
      <circle cx="20.5" cy="48" r="7" fill="var(--red)" />
    </svg>
  );
}

export function Tag({
  children,
  tone = "",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return (
    <span className={`tag ${tone}`}>
      <span className="dot" />
      {children}
    </span>
  );
}

export function SectionHead({
  number,
  title,
  detail,
  children,
}: {
  number: string;
  title: string;
  detail?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-head">
      <div>
        <span className="eyebrow">{number} / INTELLIGENCE WORKSPACE</span>
        <h2>{title}</h2>
        {detail && <p>{detail}</p>}
      </div>
      {children}
    </div>
  );
}

export function SourceLine({ s }: { s: Snapshot }) {
  return (
    <div className="source-line">
      <span className="source-pill">SYNTHETIC / ILLUSTRATIVE</span>
      <span>{s.window.join(" → ")} · USD · UTC</span>
      <span>Fixture v1 · No sampling · Not Google data</span>
    </div>
  );
}

export function Evidence({
  s,
  metrics = s.metrics,
}: {
  s: Snapshot;
  metrics?: Snapshot["metrics"];
}) {
  return (
    <div className="evidence-table">
      <table>
        <caption>Verified supporting aggregates · {s.source.label}</caption>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
            <th>Unit</th>
            <th>Evidence</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m, i) => (
            <tr key={m.metric + i}>
              <td>{m.metric.replaceAll("_", " ")}</td>
              <td>{fmt(m.value, 4)}</td>
              <td>{m.unit}</td>
              <td>
                <code>{m.query_id}</code>
                <small>
                  {m.source_id} · {m.date_range.join(" → ")}
                </small>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Funnel({
  s,
  expanded = false,
}: {
  s: Snapshot;
  expanded?: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="funnel-wrap">
      <div className="chart-title">
        <h3>The path to purchase</h3>
        <span className="eyebrow">ORDERED SESSION FUNNEL</span>
      </div>
      <div className="funnel">
        {s.funnel.map((f, i) => (
          <button
            key={f.name}
            className={`funnel-row ${i === 2 ? "highlight" : ""} ${selected === i ? "selected" : ""}`}
            onClick={() => setSelected(selected === i ? null : i)}
            aria-expanded={selected === i}
          >
            <span className="funnel-index">0{i + 1}</span>
            <span className="funnel-name">{f.name}</span>
            <span className="bar-track">
              <span
                className="bar-fill"
                style={{ width: `${Math.max(1, f.rate ?? 0)}%` }}
              />
            </span>
            <strong>{fmt(f.value)}</strong>
            <span className="funnel-rate">
              {f.rate === null ? "Undefined" : `${f.rate.toFixed(1)}%`}
            </span>
            <ChevronDown size={14} />
          </button>
        ))}
      </div>
      {selected !== null && (
        <div className="chart-detail" role="status">
          <strong>{s.funnel[selected].name}</strong> ·{" "}
          {s.funnel[selected].step_rate === null
            ? "Undefined"
            : `${s.funnel[selected].step_rate!.toFixed(1)}%`}{" "}
          of previous stage · {s.funnel[selected].value} eligible sessions.{" "}
          {selected > 0
            ? `${s.funnel[selected - 1].value - s.funnel[selected].value} sessions lost from previous stage.`
            : "Denominator: all sessions starting in the selected window."}
        </div>
      )}
      <div className="chart-foot">
        <span>Click a stage to inspect its denominator</span>
        <span>{s.query_id}</span>
      </div>
      {expanded && (
        <p className="muted">
          Closed funnel: session start → product view → cart → checkout →
          purchase. A later stage counts only if its timestamp follows the
          previous stage within the same session.
        </p>
      )}
    </div>
  );
}

export function Trend({ s }: { s: Snapshot }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...s.trend.map((d) => d.sessions), 1);
  return (
    <div className="trend">
      <div className="chart-title">
        <h3>Sessions, over time</h3>
        <span className="eyebrow">DAILY / UTC</span>
      </div>
      <div className="trend-bars">
        {s.trend.map((d, i) => (
          <button
            key={d.day}
            aria-label={`${d.day}: ${d.sessions} sessions, ${d.purchases} purchases`}
            onClick={() => setActive(active === i ? null : i)}
            className={i === active ? "active" : ""}
            style={{ height: `${(d.sessions / max) * 100}%` }}
          >
            <span
              style={{
                height: `${(d.purchases / Math.max(d.sessions, 1)) * 100}%`,
              }}
            />
          </button>
        ))}
      </div>
      <div className="chart-foot">
        <span>{s.window[0]}</span>
        <span>
          <i className="legend black" />
          Sessions <i className="legend" />
          Purchases
        </span>
        <span>{s.window[1]}</span>
      </div>
      {active !== null && (
        <p role="status" className="chart-detail">
          {s.trend[active].day}: {s.trend[active].sessions} sessions ·{" "}
          {s.trend[active].purchases} ordered purchasing sessions.
        </p>
      )}
    </div>
  );
}

export function ChannelTable({ s }: { s: Snapshot }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Session source / medium</th>
            <th>Sessions</th>
            <th>Purchases</th>
            <th>Conversion</th>
          </tr>
        </thead>
        <tbody>
          {s.channels.map((c, i) => (
            <tr key={c.channel}>
              <td>
                <span className={`channel-dot c${i}`} />
                {c.channel}
              </td>
              <td>{fmt(c.sessions)}</td>
              <td>{c.purchases}</td>
              <td>
                <strong>{c.conversion.toFixed(1)}%</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!s.channels.length && <p>No eligible sessions in this scope.</p>}
    </div>
  );
}
