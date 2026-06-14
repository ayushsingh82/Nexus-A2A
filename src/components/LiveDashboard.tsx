"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import CaptureCycle from "@/components/CaptureCycle";

const PROTOCOL_LOGO: Record<string, string> = {
  master:         "/logos/metamask.svg",
  aave:           "https://www.datocms-assets.com/166214/1758974929-1740700991-78b3ef2e096b-aave_logo.png?auto=format&fit=max&w=1200",
  "uniswap-lp":   "/logos/uniswap.svg",
  uniswap:        "/logos/uniswap.svg",
  perp:           "https://play-lh.googleusercontent.com/u-5f4DodeNbu-GykUJJ2fxVoLqLWaCwbTebu7ecgsXFmXzLOCwX_2C3ilxzcrfZFBUOMm8m8G0gILwn66XwvY3A=w240-h480-rw",
  "perp-funding": "https://play-lh.googleusercontent.com/u-5f4DodeNbu-GykUJJ2fxVoLqLWaCwbTebu7ecgsXFmXzLOCwX_2C3ilxzcrfZFBUOMm8m8G0gILwn66XwvY3A=w240-h480-rw",
};
import PnlChart from "@/components/PnlChart";
import StatusDot from "@/components/StatusDot";
import DelegationFlow from "@/components/DelegationFlow";
import { timeAgo, useLiveData } from "@/lib/useLiveData";
import type {
  Agent,
  AgentExecution,
  Delegation,
  Portfolio,
  SwarmKpis,
  YieldOpportunity,
} from "@/agents/types";

export type DashboardSnapshot = {
  kpis: SwarmKpis;
  opportunities: YieldOpportunity[];
  portfolio: Portfolio;
  agents: Agent[];
  delegations: Delegation[];
  executions: AgentExecution[];
};

const AUTOPILOT_MS = 9000;

export default function LiveDashboard({ initial }: { initial: DashboardSnapshot }) {
  const kpisQ   = useLiveData<{ kpis: SwarmKpis }>("/api/kpis", 7000, { initial: { kpis: initial.kpis } });
  const oppsQ   = useLiveData<{ opportunities: YieldOpportunity[] }>("/api/opportunities", 7000, { initial: { opportunities: initial.opportunities } });
  const portQ   = useLiveData<{ portfolio: Portfolio }>("/api/treasury", 8000, { initial: { portfolio: initial.portfolio } });
  const agentsQ = useLiveData<{ agents: Agent[]; delegations: Delegation[] }>("/api/venues", 7000, { initial: { agents: initial.agents, delegations: initial.delegations } });
  const execQ   = useLiveData<{ executions: AgentExecution[] }>("/api/executions?limit=10", 7000, { initial: { executions: initial.executions } });

  const kpis        = kpisQ.data?.kpis ?? initial.kpis;
  const opportunities = oppsQ.data?.opportunities ?? initial.opportunities;
  const portfolio   = portQ.data?.portfolio ?? initial.portfolio;
  const agents      = agentsQ.data?.agents ?? initial.agents;
  const delegations = agentsQ.data?.delegations ?? initial.delegations;
  const executions  = execQ.data?.executions ?? initial.executions;

  const refreshAll = () => { kpisQ.refresh(); oppsQ.refresh(); portQ.refresh(); agentsQ.refresh(); execQ.refresh(); };
  const refreshRef = useRef(refreshAll);
  refreshRef.current = refreshAll;

  const [autopilot, setAutopilot] = useState(true);
  const scanning = useRef(false);
  useEffect(() => {
    if (!autopilot) return;
    const id = setInterval(async () => {
      if (scanning.current) return;
      scanning.current = true;
      try { await fetch("/api/scan", { method: "POST" }); refreshRef.current(); }
      catch { /* keep last-known state */ }
      finally { scanning.current = false; }
    }, AUTOPILOT_MS);
    return () => clearInterval(id);
  }, [autopilot]);

  const [, force] = useState(0);
  useEffect(() => { const id = setInterval(() => force((n) => n + 1), 1000); return () => clearInterval(id); }, []);

  return (
    <div className="page-content">
      <ControlBar
        kpis={kpis}
        agentCount={agents.filter((a) => a.role !== "master").length}
        delegationCount={delegations.filter((d) => d.status === "active").length}
        autopilot={autopilot}
        onToggleAutopilot={() => setAutopilot((a) => !a)}
        onScanned={refreshAll}
        status={kpisQ.status}
        updatedAt={kpisQ.updatedAt}
      />

      <KpiRow kpis={kpis} />

      {/* Delegation flow animation — funds flowing from orchestrator to agents */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16, marginTop: 18 }} className="dash-2col">
        <Panel title="Delegation Flow" subtitle="ERC-7710 capital flowing · orchestrator → swarm" status={agentsQ.status} updatedAt={agentsQ.updatedAt} source="chain">
          <DelegationFlow agents={agents} delegations={delegations} running={autopilot} />
        </Panel>
        <PortfolioPanel portfolio={portfolio} status={portQ.status} updatedAt={portQ.updatedAt} />
      </div>

      <div className="dash-2col" style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 16, marginTop: 16 }}>
        <AgentTasksPanel opportunities={opportunities} status={oppsQ.status} updatedAt={oppsQ.updatedAt} />
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <div className="section-title">Command the swarm</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Type a prompt to deploy, rebalance, or query</div>
          </div>
          <div style={{ padding: "16px 18px" }}>
            <a href="/dashboard/command" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(0,1,252,0.05)", border: "1px solid rgba(0,1,252,0.15)", textDecoration: "none", color: "#0001FC", fontSize: 13, fontWeight: 600 }}>
              <span style={{ fontSize: 18 }}>⌘</span>
              Open Command →
            </a>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              {["Deploy 100 USDC to best yield", "Show portfolio status", "Rebalance from Aave to Uniswap"].map((s) => (
                <a key={s} href={`/dashboard/command`} style={{ padding: "7px 10px", background: "var(--bg-surface)", border: "1px solid var(--border)", fontSize: 11.5, color: "var(--text-secondary)", textDecoration: "none", display: "block" }}>
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="dash-2col" style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 16, marginTop: 16 }}>
        <ExecutionsPanel executions={executions} status={execQ.status} updatedAt={execQ.updatedAt} />
        <Panel title="Yield earned" subtitle="Cumulative USDC collected across all agents" status={execQ.status} updatedAt={execQ.updatedAt} source="agents">
          <div style={{ padding: "16px 18px 18px" }}>
            <div className="kpi-value" style={{ fontSize: 30 }}>
              ${kpis.totalYieldUsdc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="kpi-hint" style={{ marginBottom: 8 }}>
              {kpis.rebalanceCount} rebalances · {kpis.swarmRunCount} swarm ticks
            </div>
            <PnlChart executions={executions.map((e) => ({
              id: e.id, opportunityId: e.delegationId, atMs: e.atMs,
              cycleString: e.protocol, venueString: e.agentName,
              sizeUsdc: e.amountUsdc, realizedUsdc: e.yieldUsdc,
              netBps: e.apyBps, latencyMs: 0, txHash: e.txHash, success: e.success,
            }))} />
          </div>
        </Panel>
      </div>

      <AgentRegistryPanel agents={agents} delegations={delegations} status={agentsQ.status} updatedAt={agentsQ.updatedAt} />

      <style>{`@media (max-width: 980px) { .dash-2col { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

/* ── Control bar ──────────────────────────────────────────────────── */
function ControlBar({ kpis, agentCount, delegationCount, autopilot, onToggleAutopilot, onScanned, status, updatedAt }: {
  kpis: SwarmKpis; agentCount: number; delegationCount: number;
  autopilot: boolean; onToggleAutopilot: () => void; onScanned: () => void;
  status: "loading" | "live" | "error"; updatedAt: number;
}) {
  const lastSwarmAgo = kpis.lastSwarmAtMs ? timeAgo(kpis.lastSwarmAtMs) : "never";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "14px 18px", border: "1px solid var(--border)", borderRadius: 0, background: "linear-gradient(180deg, rgba(0,1,252,0.04) 0%, var(--bg-elevated) 100%)", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <span className="live-pill">
          <span className="live-pill__dot" />
          {autopilot ? "autopilot · running" : "manual · paused"}
        </span>
        <span style={{ fontSize: 12.5, color: "var(--text-secondary)", fontFamily: "var(--font-geist-mono)" }}>
          last swarm {lastSwarmAgo} · {agentCount} sub-agents · {delegationCount} active delegations
        </span>
        <StatusDot status={status} updatedAt={updatedAt} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onToggleAutopilot} className={`argo-switch${autopilot ? " argo-switch--on" : ""}`} aria-pressed={autopilot} title="Toggle continuous swarm">
          <span className="argo-switch__knob" />
          <span className="argo-switch__label">Autopilot</span>
        </button>
        <CaptureCycle onScanned={onScanned} />
      </div>
    </div>
  );
}

/* ── Panel shell ──────────────────────────────────────────────────── */
function Panel({ title, subtitle, status, updatedAt, source, children }: {
  title: string; subtitle?: string; status: "loading" | "live" | "error";
  updatedAt: number; source?: string; children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div className="section-title">{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{subtitle}</div>}
        </div>
        <StatusDot status={status} updatedAt={updatedAt} source={source} />
      </div>
      {children}
    </div>
  );
}

/* ── KPI tiles ────────────────────────────────────────────────────── */
function KpiRow({ kpis }: { kpis: SwarmKpis }) {
  const tiles = [
    { label: "Deployed",         value: `$${(kpis.totalDeployedUsdc / 1000).toFixed(0)}k`, hint: "USDC across 3 protocols", bars: [60, 65, 72, 74, 78, 80, 83, 87, 90, 93, 95], accent: false },
    { label: "Avg APY",          value: `${(kpis.avgApyBps / 100).toFixed(1)}%`,            hint: "weighted across agents",  bars: [40, 48, 52, 55, 58, 62, 65, 68, 71, 75, 78], accent: true  },
    { label: "Yield earned",     value: `$${kpis.totalYieldUsdc.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, hint: `${kpis.rebalanceCount} rebalances`, bars: [5, 8, 11, 14, 18, 22, 26, 31, 36, 42, 48], accent: true },
    { label: "Active delegations", value: kpis.delegationsActive.toString(),                hint: "ERC-7710 subdelegations", bars: [1, 1, 2, 2, 3, 3, 3, 3, 3, 3, 3], accent: false },
  ];
  return (
    <div className="grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="kpi-card" style={{ position: "relative", overflow: "hidden", borderColor: t.accent ? "rgba(0, 1, 252, 0.18)" : "var(--border)" }}>
          <div className="kpi-label">{t.label}</div>
          <div className="kpi-value" style={{ color: t.accent ? "var(--teal-text)" : "var(--text-primary)" }}>{t.value}</div>
          <div className="kpi-hint">{t.hint}</div>
          <Sparkline bars={t.bars} accent={t.accent} />
        </div>
      ))}
    </div>
  );
}

function Sparkline({ bars, accent }: { bars: number[]; accent: boolean }) {
  const max = Math.max(...bars);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, marginTop: 14, height: 32 }}>
      {bars.map((b, i) => (
        <div key={i} style={{ flex: 1, height: `${(b / max) * 100}%`, borderRadius: 0, background: accent ? "var(--brand-green)" : "var(--border-strong)", opacity: accent ? 0.85 - (bars.length - 1 - i) * 0.04 : 0.6 - (bars.length - 1 - i) * 0.03 }} />
      ))}
    </div>
  );
}

/* ── Agent tasks (yield opportunities) ───────────────────────────── */
function AgentTasksPanel({ opportunities, status, updatedAt }: { opportunities: YieldOpportunity[]; status: "loading" | "live" | "error"; updatedAt: number }) {
  return (
    <Panel title="Active agent tasks" subtitle="Live yield being earned by each sub-agent" status={status} updatedAt={updatedAt} source="agents">
      {opportunities.length === 0 ? (
        <EmptyState text="No active tasks — run a swarm cycle to deploy capital." />
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {opportunities.map((o) => <TaskRow key={o.id} opp={o} />)}
        </ul>
      )}
    </Panel>
  );
}

function TaskRow({ opp }: { opp: YieldOpportunity }) {
  const apyColor = opp.apyBps >= 1000 ? "var(--teal-text)" : "var(--text-primary)";
  const logo = PROTOCOL_LOGO[opp.agentId] ?? "";
  return (
    <li style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 16, alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {logo && (
          <div style={{ width: 28, height: 28, borderRadius: 7, overflow: "hidden", background: "var(--bg-surface)", border: "1px solid var(--border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Image src={logo} alt={opp.agentName} width={20} height={20} style={{ objectFit: "contain" }} unoptimized />
          </div>
        )}
        <div>
          <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text-primary)" }}>{opp.agentName}</div>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 3, fontFamily: "var(--font-geist-mono)" }}>
            {opp.protocol} · {opp.asset}
          </div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 16, fontWeight: 700, color: apyColor }}>
          {(opp.apyBps / 100).toFixed(2)}%
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>APY</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13, color: "var(--text-primary)" }}>
          ${opp.deployedUsdc.toLocaleString()}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>deployed</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13, color: "var(--green)", fontWeight: 600 }}>
          +${opp.earnedUsdc.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>earned</div>
      </div>
    </li>
  );
}

/* ── Portfolio ────────────────────────────────────────────────────── */
function PortfolioPanel({ portfolio, status, updatedAt }: { portfolio: Portfolio; status: "loading" | "live" | "error"; updatedAt: number }) {
  const agentColors: Record<string, string> = {
    aave: "var(--brand-green)",
    uniswap: "#1d4ed8",
    perp: "#7c3aed",
  };
  const agentLabels: Record<string, string> = { aave: "Aave Agent", uniswap: "Uniswap LP", perp: "Perp Funding" };
  const segments = Object.entries(portfolio.byAgent).map(([id, val]) => ({
    label: agentLabels[id] ?? id,
    value: val,
    color: agentColors[id] ?? "var(--border-strong)",
  }));

  return (
    <Panel title="Portfolio" subtitle={`${Object.keys(portfolio.byAgent).length} protocols · ERC-7710 delegated`} status={status} updatedAt={updatedAt} source="portfolio">
      <div style={{ padding: "20px 20px 8px" }}>
        <div className="kpi-label">Total cap (master delegation)</div>
        <div className="kpi-value" style={{ fontSize: 34 }}>
          ${portfolio.totalUsdc.toLocaleString()}
        </div>
        <div className="kpi-hint">
          ${portfolio.deployedUsdc.toLocaleString()} deployed · ${portfolio.idleUsdc.toLocaleString()} idle
        </div>
        <ProportionalBar segments={segments} />
      </div>
      <div style={{ padding: "12px 20px 20px" }}>
        <div className="nav-section-label" style={{ padding: 0, marginBottom: 8 }}>By agent (deployed USDC)</div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {Object.entries(portfolio.byAgent).map(([id, amount]) => (
            <li key={id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 12.5, borderBottom: "1px dashed var(--border)" }}>
              <span className="font-mono" style={{ color: "var(--text-secondary)" }}>{agentLabels[id] ?? id}</span>
              <span className="font-mono" style={{ color: amount > 0 ? "var(--text-primary)" : "var(--text-muted)" }}>${amount.toLocaleString()}</span>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)" }}>
          est. weekly yield: <span style={{ color: "var(--teal-text)", fontWeight: 700 }}>${portfolio.weeklyYieldUsdc.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    </Panel>
  );
}

function ProportionalBar({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", width: "100%", height: 10, borderRadius: 0, overflow: "hidden", border: "1px solid var(--border)" }}>
        {segments.map((s) => (
          <div key={s.label} title={`${s.label}: $${s.value.toLocaleString()}`} style={{ width: `${(s.value / total) * 100}%`, background: s.color, transition: "width 0.4s ease" }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, gap: 8, flexWrap: "wrap" }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 0, background: s.color, display: "inline-block" }} />
            <span style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>{s.label}</span>
            <span className="font-mono" style={{ fontSize: 11.5, color: "var(--text-muted)" }}>${s.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Executions ───────────────────────────────────────────────────── */
function ExecutionsPanel({ executions, status, updatedAt }: { executions: AgentExecution[]; status: "loading" | "live" | "error"; updatedAt: number }) {
  const actionColor: Record<string, string> = {
    "collect-yield": "var(--green)",
    "redelegate": "var(--teal-text)",
    "deposit": "#1d4ed8",
    "rebalance": "#d97706",
    "withdraw": "var(--red)",
  };
  return (
    <Panel title="Agent execution log" subtitle="Every row is an onchain action via 1Shot relayer" status={status} updatedAt={updatedAt} source="1shot receipts">
      {executions.length === 0 ? (
        <EmptyState text="No executions yet — run a swarm cycle." />
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {executions.map((e) => (
            <li key={e.id} style={{ display: "grid", gridTemplateColumns: "72px 1fr 80px 100px 80px", gap: 12, alignItems: "center", padding: "11px 20px", borderBottom: "1px solid var(--border)", fontSize: 12.5 }}>
              <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)" }}>{timeAgo(e.atMs)}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-primary)", fontWeight: 600 }}>{e.agentName}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{e.protocol} · {e.txHash}</div>
              </div>
              <span style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 700, color: actionColor[e.action] ?? "var(--text-secondary)", textAlign: "right" }}>
                {e.action}
              </span>
              <span style={{ fontFamily: "var(--font-geist-mono)", textAlign: "right", color: e.yieldUsdc > 0 ? "var(--green)" : "var(--text-secondary)", fontWeight: e.yieldUsdc > 0 ? 600 : 400 }}>
                {e.yieldUsdc > 0 ? `+$${e.yieldUsdc.toFixed(4)}` : `$${e.amountUsdc.toLocaleString()}`}
              </span>
              <span style={{ fontFamily: "var(--font-geist-mono)", textAlign: "right", color: "var(--text-muted)" }}>
                {(e.apyBps / 100).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ── Agent registry ───────────────────────────────────────────────── */
function AgentRegistryPanel({ agents, delegations, status, updatedAt }: { agents: Agent[]; delegations: Delegation[]; status: "loading" | "live" | "error"; updatedAt: number }) {
  const statusStyle: Record<string, { bg: string; color: string }> = {
    active:      { bg: "rgba(34,197,94,0.12)", color: "#15803d" },
    idle:        { bg: "rgba(0,0,0,0.05)", color: "var(--text-secondary)" },
    deploying:   { bg: "rgba(245,158,11,0.10)", color: "#b45309" },
    rebalancing: { bg: "rgba(124,58,237,0.10)", color: "#5b21b6" },
    scanning:    { bg: "rgba(37,99,235,0.10)", color: "#1d4ed8" },
  };
  return (
    <Panel title="Agent registry" subtitle="Master orchestrator + 3 ERC-7710 subdelegated agents" status={status} updatedAt={updatedAt} source="agents">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 0 }}>
        {agents.map((agent) => {
          const del = delegations.find((d) => d.to === agent.role);
          const s = statusStyle[agent.status] ?? statusStyle.idle;
          const logo = PROTOCOL_LOGO[agent.role] ?? "";
          return (
            <div key={agent.id} style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {logo && (
                    <div style={{ width: 32, height: 32, borderRadius: 8, overflow: "hidden", background: "var(--bg-surface)", border: "1px solid var(--border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Image src={logo} alt={agent.name} width={24} height={24} style={{ objectFit: "contain" }} unoptimized />
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{agent.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, fontFamily: "var(--font-geist-mono)" }}>{agent.protocol} · {agent.chain}</div>
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 0, background: s.bg, color: s.color }}>{agent.status}</span>
              </div>
              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Cap</div>
                  <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>${(agent.delegatedCapUsdc / 1000).toFixed(0)}k</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>APY</div>
                  <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13, fontWeight: 600, color: agent.currentApyBps > 0 ? "var(--teal-text)" : "var(--text-muted)", marginTop: 2 }}>
                    {agent.currentApyBps > 0 ? `${(agent.currentApyBps / 100).toFixed(1)}%` : "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Deployed</div>
                  <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>
                    ${agent.deployedUsdc > 0 ? `${(agent.deployedUsdc / 1000).toFixed(0)}k` : "0"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Earned</div>
                  <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13, fontWeight: 600, color: agent.earnedUsdc > 0 ? "var(--green)" : "var(--text-muted)", marginTop: 2 }}>
                    {agent.earnedUsdc > 0 ? `+$${agent.earnedUsdc.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
                  </div>
                </div>
              </div>
              {del && (
                <div style={{ marginTop: 12, padding: "8px 10px", background: "var(--bg-surface)", borderRadius: 0, fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)" }}>
                  {del.id} · {del.permissionType} · {((del.usedUsdc / del.capUsdc) * 100).toFixed(0)}% used
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div style={{ padding: "44px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>{text}</div>;
}
