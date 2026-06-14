"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Agent, Delegation } from "@/agents/types";

const PROTOCOL_LOGO: Record<string, string> = {
  aave:           "https://www.datocms-assets.com/166214/1758974929-1740700991-78b3ef2e096b-aave_logo.png?auto=format&fit=max&w=1200",
  "uniswap-lp":   "/logos/uniswap.svg",
  "perp-funding": "https://play-lh.googleusercontent.com/u-5f4DodeNbu-GykUJJ2fxVoLqLWaCwbTebu7ecgsXFmXzLOCwX_2C3ilxzcrfZFBUOMm8m8G0gILwn66XwvY3A=w240-h480-rw",
};

function usd(n: number) {
  return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

const AGENT_COLOR: Record<string, string> = {
  aave:          "#B6509E",
  "uniswap-lp":  "#FF007A",
  "perp-funding": "#0891b2",
};

type Gate = { id: string; label: string; detail: string; passed: boolean };

function buildGates(agent: Agent, del: Delegation | undefined): Gate[] {
  const utilPct = del ? (del.usedUsdc / del.capUsdc) * 100 : 0;
  const apyBps = agent.currentApyBps;
  return [
    {
      id: "cap",
      label: "Utilization within cap",
      detail: `${utilPct.toFixed(1)}% of delegated cap — limit 95%`,
      passed: utilPct < 95,
    },
    {
      id: "apy",
      label: "APY in target range",
      detail: `${(apyBps / 100).toFixed(2)}% — target 3–25%`,
      passed: apyBps >= 300 && apyBps <= 2500,
    },
    {
      id: "concentration",
      label: "Concentration check",
      detail: `single-agent cap $${(del?.capUsdc ?? 0).toLocaleString()} ≤ $200,000`,
      passed: (del?.capUsdc ?? 0) <= 200_000,
    },
    {
      id: "status",
      label: "Agent status healthy",
      detail: `status: ${agent.status}`,
      passed: agent.status === "active",
    },
    {
      id: "redelegation",
      label: "ERC-7710 delegation valid",
      detail: del ? `${del.id} · ${del.permissionType}` : "no delegation",
      passed: del?.status === "active",
    },
  ];
}

type RiskBand = "low" | "medium" | "high";
function riskBand(agent: Agent, del: Delegation | undefined): RiskBand {
  const util = del ? (del.usedUsdc / del.capUsdc) * 100 : 0;
  if (util > 90 || agent.currentApyBps > 2000) return "high";
  if (util > 75 || agent.currentApyBps > 1200) return "medium";
  return "low";
}

const RISK_COLORS: Record<RiskBand, { bg: string; color: string; label: string }> = {
  low:    { bg: "rgba(34,197,94,0.12)",  color: "#15803d", label: "LOW" },
  medium: { bg: "rgba(245,158,11,0.12)", color: "#b45309", label: "MED" },
  high:   { bg: "rgba(220,38,38,0.12)",  color: "#dc2626", label: "HIGH" },
};

export default function RiskPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [contradictionMode, setContradictionMode] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/venues");
        const data = await res.json();
        setAgents(data.agents ?? []);
        setDelegations(data.delegations ?? []);
      } finally {
        setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 9000);
    return () => clearInterval(id);
  }, []);

  const subAgents = agents.filter((a) => a.role !== "master");
  const masterAgent = agents.find((a) => a.role === "master");
  const totalDeployed = subAgents.reduce((s, a) => s + a.deployedUsdc, 0);
  const totalCap = masterAgent?.delegatedCapUsdc ?? 500_000;

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div className="card" style={{ padding: "14px 20px", flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div className="section-title">Risk Engine</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                Real-time risk monitoring across all ERC-7710 delegated positions
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12.5, color: "var(--text-secondary)", userSelect: "none" }}>
              <input
                type="checkbox"
                checked={contradictionMode}
                onChange={(e) => setContradictionMode(e.target.checked)}
                style={{ accentColor: "#dc2626" }}
              />
              Inject contradiction signal
            </label>
          </div>
        </div>
      </div>

      {/* Contradiction alert */}
      {contradictionMode && (
        <div style={{ padding: "12px 18px", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14 }}>⚠</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#dc2626" }}>Contradiction signal active</div>
            <div style={{ fontSize: 11.5, color: "var(--text-secondary)", marginTop: 1 }}>
              Risk gates are tightened — rebalancing blocked until signal clears. ERC-7710 delegations remain valid but no new capital is deployed.
            </div>
          </div>
        </div>
      )}

      {/* Global KPIs */}
      <div className="grid-cols-4" style={{ marginBottom: 16 }}>
        {[
          { label: "Total exposure", value: usd(totalDeployed), hint: `${((totalDeployed / totalCap) * 100).toFixed(1)}% of ${usd(totalCap)} master cap` },
          { label: "Active positions", value: subAgents.filter((a) => a.deployedUsdc > 0).length.toString(), hint: "agents with deployed capital" },
          { label: "Max single-agent", value: usd(Math.max(...subAgents.map((a) => a.deployedUsdc))), hint: "highest concentration" },
          { label: "Risk status", value: contradictionMode ? "BLOCKED" : "NOMINAL", hint: contradictionMode ? "contradiction signal active" : "all gates passing", accent: contradictionMode },
        ].map((t) => (
          <div key={t.label} className="kpi-card" style={{ borderColor: (t as { accent?: boolean }).accent ? "rgba(220,38,38,0.3)" : "var(--border)" }}>
            <div className="kpi-label">{t.label}</div>
            <div className="kpi-value" style={{ color: (t as { accent?: boolean }).accent ? "#dc2626" : "var(--text-primary)" }}>{t.value}</div>
            <div className="kpi-hint">{t.hint}</div>
          </div>
        ))}
      </div>

      {/* Per-agent risk cards */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Analyzing positions…</div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {subAgents.map((agent) => {
            const del = delegations.find((d) => d.to === agent.role);
            const gates = buildGates(agent, del);
            const band = riskBand(agent, del);
            const risk = contradictionMode ? RISK_COLORS.high : RISK_COLORS[band];
            const activeDel = contradictionMode ? { ...del!, status: "revoked" as const } : del;
            const failCount = gates.filter((g) => !g.passed).length + (contradictionMode ? 1 : 0);
            const color = AGENT_COLOR[agent.role] ?? "#0001FC";
            const utilPct = del ? ((del.usedUsdc / del.capUsdc) * 100) : 0;

            return (
              <div key={agent.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                {/* Agent header */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 16, alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {PROTOCOL_LOGO[agent.role] ? (
                        <div style={{ width: 22, height: 22, borderRadius: 6, overflow: "hidden", background: "var(--bg-surface)", border: "1px solid var(--border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Image src={PROTOCOL_LOGO[agent.role]} alt={agent.name} width={16} height={16} style={{ objectFit: "contain" }} unoptimized />
                        </div>
                      ) : (
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
                      )}
                      <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{agent.name}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 3, fontFamily: "var(--font-geist-mono)" }}>
                      {agent.protocol} · {activeDel?.id ?? "—"} · ERC-7710
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{usd(agent.deployedUsdc)}</div>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>deployed</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 15, fontWeight: 700, color }}>
                      {(agent.currentApyBps / 100).toFixed(2)}%
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>APY</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", padding: "4px 12px", background: risk.bg, color: risk.color }}>
                    {contradictionMode ? "HIGH" : risk.label}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                  {/* Utilization */}
                  <div style={{ padding: "16px 20px", borderRight: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, marginBottom: 10 }}>
                      Cap utilization
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                      <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13, color: "var(--text-secondary)" }}>
                        {usd(del?.usedUsdc ?? 0)} / {usd(del?.capUsdc ?? 0)}
                      </span>
                      <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13, fontWeight: 700, color }}>
                        {utilPct.toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ height: 8, background: "var(--border)", borderRadius: 0 }}>
                      <div style={{ height: "100%", width: `${Math.min(utilPct, 100)}%`, background: utilPct > 90 ? "#dc2626" : utilPct > 75 ? "#d97706" : color, transition: "width 0.4s ease" }} />
                    </div>
                    {utilPct > 90 && (
                      <div style={{ fontSize: 11, color: "#dc2626", marginTop: 6 }}>⚠ Near cap limit</div>
                    )}
                  </div>

                  {/* Gate checklist */}
                  <div style={{ padding: "16px 20px" }}>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                      <span>Risk gates</span>
                      <span style={{ color: failCount > 0 ? "#dc2626" : "#15803d" }}>
                        {gates.length - failCount}/{gates.length} passing
                      </span>
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                      {gates.map((g) => {
                        const passed = contradictionMode && g.id === "status" ? false : g.passed;
                        return (
                          <li key={g.id} style={{ display: "flex", gap: 8, fontSize: 11.5 }}>
                            <span style={{ color: passed ? "#16a34a" : "#dc2626", fontWeight: 700, flexShrink: 0 }}>{passed ? "✓" : "✗"}</span>
                            <span>
                              <span style={{ color: passed ? "var(--text-primary)" : "#dc2626" }}>{g.label}</span>
                              <span style={{ color: "var(--text-muted)" }}> — {g.detail}</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* A2A connectivity note */}
      <div className="card" style={{ padding: "16px 20px", marginTop: 16, background: "rgba(0,1,252,0.03)", borderColor: "rgba(0,1,252,0.15)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{ fontSize: 16, marginTop: 2 }}>⟲</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0001FC" }}>A2A Risk Coordination</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.6 }}>
              The Risk Engine communicates risk signals agent-to-agent via ERC-7710 redelegation events. When a gate fails, the orchestrator automatically reduces that agent's delegated cap and reallocates to passing agents — no manual intervention required.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
