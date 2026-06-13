"use client";

import { useEffect, useState } from "react";
import type { Agent } from "@/agents/types";

function usd(n: number, dp = 0) {
  return "$" + n.toLocaleString(undefined, { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

const STRATEGIES = [
  {
    id: "max-yield",
    name: "Max Yield",
    description: "Concentrate capital in the highest-APY agent. Highest return, highest concentration risk.",
    allocations: { aave: 0.0, uniswap: 0.0, perp: 1.0 },
    riskLevel: "High",
    riskColor: "#dc2626",
  },
  {
    id: "balanced",
    name: "Balanced",
    description: "Equal weight across all three agents. Moderate yield with diversification.",
    allocations: { aave: 0.33, uniswap: 0.34, perp: 0.33 },
    riskLevel: "Medium",
    riskColor: "#d97706",
  },
  {
    id: "stable-first",
    name: "Stable First",
    description: "Heavy Aave weight for predictable USDC yield. Conservative; lower volatility.",
    allocations: { aave: 0.60, uniswap: 0.25, perp: 0.15 },
    riskLevel: "Low",
    riskColor: "#15803d",
  },
  {
    id: "lp-heavy",
    name: "LP Heavy",
    description: "Focus on Uniswap V3 LP fees + Aave buffer. Earns fee yield with impermanent loss risk.",
    allocations: { aave: 0.20, uniswap: 0.65, perp: 0.15 },
    riskLevel: "Medium",
    riskColor: "#d97706",
  },
];

const AGENT_COLOR: Record<string, string> = {
  aave:    "#B6509E",
  uniswap: "#FF007A",
  perp:    "#0891b2",
};

const AGENT_LABEL: Record<string, string> = {
  aave:    "Aave Agent",
  uniswap: "Uniswap LP",
  perp:    "Perp Funding",
};

export default function StrategyPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("balanced");
  const [deployAmount, setDeployAmount] = useState(100_000);
  const [simulated, setSimulated] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/venues");
        const data = await res.json();
        setAgents(data.agents ?? []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const subAgents = agents.filter((a) => a.role !== "master");
  const strategy = STRATEGIES.find((s) => s.id === selected) ?? STRATEGIES[1];

  function weightedApy(): number {
    return subAgents.reduce((sum, agent) => {
      const key = agent.id as keyof typeof strategy.allocations;
      const w = strategy.allocations[key] ?? 0;
      return sum + w * agent.currentApyBps;
    }, 0);
  }

  const apyBps = loading ? 0 : weightedApy();
  const weeklyYield = deployAmount * (apyBps / 10_000) / 52;
  const annualYield = deployAmount * (apyBps / 10_000);

  return (
    <div className="page-content">
      {/* Header */}
      <section className="card" style={{ padding: "18px 20px", marginBottom: 16 }}>
        <div className="section-title">Strategy Lab</div>
        <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 4 }}>
          Design and simulate yield strategies across the swarm before deploying via ERC-7710 subdelegation
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16 }} className="strat-grid">

        {/* Strategy selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
            Select Strategy
          </div>
          {STRATEGIES.map((s) => (
            <button
              key={s.id}
              onClick={() => { setSelected(s.id); setSimulated(false); }}
              style={{
                padding: "14px 16px",
                border: selected === s.id ? "2px solid #0001FC" : "1px solid var(--border)",
                background: selected === s.id ? "rgba(0,1,252,0.04)" : "var(--bg-elevated)",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 13.5, color: selected === s.id ? "#0001FC" : "var(--text-primary)" }}>{s.name}</span>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", padding: "2px 8px", background: `${s.riskColor}1a`, color: s.riskColor }}>
                  {s.riskLevel} Risk
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 5, lineHeight: 1.5 }}>{s.description}</div>

              {/* Mini allocation bar */}
              <div style={{ display: "flex", height: 4, marginTop: 10, overflow: "hidden", borderRadius: 0, gap: 1 }}>
                {Object.entries(s.allocations).map(([k, v]) => (
                  <div key={k} style={{ flex: v, background: AGENT_COLOR[k] ?? "#999", opacity: v > 0 ? 1 : 0 }} />
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Simulation panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Deploy amount input */}
          <div className="card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 10 }}>
              Capital to deploy (USDC)
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[10_000, 50_000, 100_000, 250_000, 500_000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => { setDeployAmount(amt); setSimulated(false); }}
                  style={{
                    padding: "6px 14px",
                    border: deployAmount === amt ? "2px solid #0001FC" : "1px solid var(--border)",
                    background: deployAmount === amt ? "rgba(0,1,252,0.06)" : "var(--bg-surface)",
                    fontSize: 12.5,
                    fontFamily: "var(--font-geist-mono)",
                    fontWeight: 700,
                    color: deployAmount === amt ? "#0001FC" : "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  {usd(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Allocation breakdown */}
          <div className="card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 14 }}>
              {strategy.name} — Allocation
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(strategy.allocations).map(([k, weight]) => {
                const agent = subAgents.find((a) => a.id === k);
                const amount = deployAmount * weight;
                const apy = agent?.currentApyBps ?? 0;
                const color = AGENT_COLOR[k] ?? "#999";
                return (
                  <div key={k}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{AGENT_LABEL[k] ?? k}</span>
                      </div>
                      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                        <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12.5, color: "var(--text-secondary)" }}>{usd(amount)}</span>
                        <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12.5, fontWeight: 700, color }}>
                          {apy > 0 ? `${(apy / 100).toFixed(2)}% APY` : "—"}
                        </span>
                        <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", width: 40, textAlign: "right" }}>
                          {(weight * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div style={{ height: 5, background: "var(--border)", borderRadius: 0 }}>
                      <div style={{ height: "100%", width: `${weight * 100}%`, background: color, transition: "width 0.4s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Yield simulation */}
          <div className="card" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                Yield Projection
              </div>
              <button
                onClick={() => setSimulated(true)}
                style={{ padding: "7px 18px", background: "#0001FC", color: "#fff", border: "none", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", cursor: "pointer" }}
              >
                ▶ Simulate
              </button>
            </div>

            {!simulated ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>
                Click Simulate to run yield projection
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  { period: "Weekly", value: weeklyYield },
                  { period: "Monthly", value: weeklyYield * 4.3 },
                  { period: "Annual", value: annualYield },
                ].map((r) => (
                  <div key={r.period} style={{ padding: "12px 14px", background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>{r.period}</div>
                    <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 16, fontWeight: 800, color: "var(--green)", marginTop: 6 }}>
                      +{usd(r.value, 2)}
                    </div>
                  </div>
                ))}
                <div style={{ gridColumn: "1 / -1", padding: "10px 14px", background: "rgba(0,1,252,0.04)", border: "1px solid rgba(0,1,252,0.15)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--text-secondary)" }}>
                    <span>Weighted APY</span>
                    <span style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 700, color: "#0001FC" }}>
                      {loading ? "—" : `${(apyBps / 100).toFixed(2)}%`}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--text-secondary)", marginTop: 4 }}>
                    <span>Deploy via</span>
                    <span style={{ fontFamily: "var(--font-geist-mono)" }}>ERC-7710 subdelegation · 1Shot relay</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Deploy button */}
          {simulated && (
            <a
              href="/dashboard/command"
              style={{ display: "block", padding: "14px 20px", background: "#0001FC", color: "#fff", textAlign: "center", textDecoration: "none", fontWeight: 700, fontSize: 14, letterSpacing: "0.03em" }}
            >
              Deploy {strategy.name} strategy via Command →
            </a>
          )}
        </div>
      </div>

      <style>{`@media (max-width: 900px) { .strat-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
