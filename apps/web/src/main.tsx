import React from "react";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  CircleHelp,
  SlidersHorizontal,
  FlaskConical,
  LayoutDashboard,
  Route,
  Sparkles,
  ShieldCheck,
  Presentation,
  Database,
  Menu,
  X,
  Clock3,
} from "lucide-react";
import { createRoot } from "react-dom/client";
import type { LucideIcon } from "lucide-react";
import { data } from "./analytics";
import { setAnalyticsConsent } from "./measurement";
import { useDialog } from "./hooks";
import { Mark, Tag } from "./components/UI";
import Overview from "./pages/Overview";
import Measurement from "./pages/Measurement";
import Journey from "./pages/Journey";
import Ask from "./pages/Ask";
import Evaluation from "./pages/Evaluation";
import Client from "./pages/Client";
import Sources from "./pages/Sources";
import "./tokens.css";
import "./style.css";
const navigation: [string, LucideIcon, string][] = [
  ["Overview", LayoutDashboard, "01"],
  ["Measurement Lab", FlaskConical, "02"],
  ["Customer Journey", Route, "03"],
  ["Ask !", Sparkles, "04"],
  ["Evaluation Studio", ShieldCheck, "05"],
  ["Client Room", Presentation, "06"],
  ["Data Sources", Database, "07"],
];
function App() {
  const valid = navigation.map((n) => n[0]);
  const initial = decodeURIComponent(location.hash.slice(1));
  const [page, setPage] = useState(
    valid.includes(initial) ? initial : "Overview",
  );
  const [period, setPeriod] = useState("full");
  const [channel, setChannel] = useState("all");
  const [mobile, setMobile] = useState(false);
  const [showScope, setShowScope] = useState(false);
  const [help, setHelp] = useState(false);
  useDialog(help, () => setHelp(false));
  const s = data[period + "|" + channel];
  function go(p: string) {
    setPage(p);
    location.hash = encodeURIComponent(p);
    setMobile(false);
    window.scrollTo(0, 0);
  }
  useEffect(() => {
    const f = () => {
      const p = decodeURIComponent(location.hash.slice(1));
      if (valid.includes(p)) setPage(p);
    };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  useEffect(() => {
    if (localStorage.getItem("analytics-consent") === "true")
      setAnalyticsConsent(true);
  }, []);
  return (
    <div className="app">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <a className="brand" href="#Overview" onClick={() => go("Overview")}>
          <Mark />
          <span>
            FROM SIGNAL
            <br />
            TO DECISION.
          </span>
        </a>
        <div className="sidebar-label">
          YOUR WORKSPACE <span>↗</span>
        </div>
        <nav aria-label="Main navigation">
          {navigation.map(([name, Icon, num]) => (
            <button
              key={name}
              aria-current={page === name ? "page" : undefined}
              onClick={() => go(name)}
            >
              <Icon size={17} />
              <span>{name}</span>
              <small>{num}</small>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-note">
            <div className="mini-mark">!</div>
            <span>
              Independent by design.
              <br />
              <strong>Evidence by default.</strong>
            </span>
          </div>
          <button className="help-button" onClick={() => setHelp(true)}>
            <CircleHelp size={16} />
            About this workspace
            <ArrowUpRight size={13} />
          </button>
          <span className="version">
            ! / PORTFOLIO EDITION <span>V.01</span>
          </span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label={mobile ? "Close navigation" : "Open navigation"}
              onClick={() => setMobile(!mobile)}
            >
              {mobile ? <X /> : <Menu />}
            </button>
            <span>Workspace</span>
            <span className="slash">/</span>
            <strong>{page}</strong>
          </div>
          <div className="top-actions">
            <span className="top-status">
              <span className="dot" /> OFFLINE DEMO
            </span>
            <button
              className="icon-button scope-button"
              aria-label="Inspect current data scope"
              onClick={() => setShowScope(!showScope)}
            >
              <SlidersHorizontal size={17} />
            </button>
            <span className="avatar" aria-label="Portfolio workspace">
              !
            </span>
          </div>
        </header>
        <main id="main">
          <div className="workspace-toolbar">
            <div>
              <span className="eyebrow">MARKETING INTELLIGENCE</span>
              <span className="workspace-date">Evidence, with context.</span>
            </div>
            {!["Measurement Lab", "Evaluation Studio"].includes(page) ? (
              <div className="filters">
                <label aria-label="Date range">
                  <Clock3 size={14} />
                  <select
                    aria-label="Date range"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                  >
                    <option value="full">01 – 14 Jan 2021</option>
                    <option value="first">01 – 07 Jan 2021</option>
                    <option value="second">08 – 14 Jan 2021</option>
                  </select>
                </label>
                <label>
                  <select
                    aria-label="Channel filter"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                  >
                    <option value="all">All channels</option>
                    {[
                      "google / organic",
                      "newsletter / email",
                      "google / cpc",
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
              <Tag>
                {page === "Measurement Lab"
                  ? "FIRST-PARTY DEMO EVENTS"
                  : "RECORDED FIXTURE EVALUATION"}
              </Tag>
            )}
          </div>
          {showScope && (
            <div className="scope-detail" role="status">
              <Tag>FIXTURE SOURCE</Tag>
              <span>
                {s.source.sampling} Window: {s.window.join(" → ")}. Query:{" "}
                {s.query_id}. Currency: USD. Timezone: UTC. Filtered channel:{" "}
                {channel}.
              </span>
            </div>
          )}
          {page === "Overview" ? (
            <Overview s={s} go={go} />
          ) : page === "Measurement Lab" ? (
            <Measurement />
          ) : page === "Customer Journey" ? (
            <Journey s={s} />
          ) : page === "Ask !" ? (
            <Ask s={s} />
          ) : page === "Evaluation Studio" ? (
            <Evaluation />
          ) : page === "Client Room" ? (
            <Client s={s} />
          ) : (
            <Sources s={s} />
          )}
          <footer className="app-footer">
            <span>
              <span className="red-tick" /> ! — FROM SIGNAL TO DECISION.
            </span>
            <span>
              Independent applicant-built portfolio. No agency affiliation.
            </span>
            <button className="text-button" onClick={() => go("Data Sources")}>
              Source & limitations <ArrowUpRight size={12} />
            </button>
          </footer>
        </main>
      </div>
      {help && (
        <div className="modal-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-title"
            className="modal"
          >
            <button
              className="close icon-button"
              aria-label="Close about"
              onClick={() => setHelp(false)}
            >
              <X />
            </button>
            <Mark />
            <h2 id="about-title">
              FROM SIGNAL
              <br />
              TO DECISION.
            </h2>
            <p>
              ! is an independent portfolio for evidence-led marketing analysis.
              The public demo runs on clearly labelled synthetic fixtures with a
              deterministic analyst. No live model call, agency endorsement or
              real business outcome is claimed.
            </p>
            <p>
              Explore Measurement Lab, ask a supported question, inspect a
              baseline failure, then review and export a client recommendation.
            </p>
            <button
              className="button black"
              onClick={() => {
                setHelp(false);
                go("Measurement Lab");
              }}
            >
              Start the walkthrough <ArrowRight size={16} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
