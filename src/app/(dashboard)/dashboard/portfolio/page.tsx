"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Agent, Portfolio, SwarmKpis } from "@/agents/types";

const PROTOCOL_LOGO: Record<string, string> = {
  aave:    "https://www.datocms-assets.com/166214/1758974929-1740700991-78b3ef2e096b-aave_logo.png?auto=format&fit=max&w=1200",
  uniswap: "/logos/uniswap.svg",
  perp:    "https://play-lh.googleusercontent.com/u-5f4DodeNbu-GykUJJ2fxVoLqLWaCwbTebu7ecgsXFmXzLOCwX_2C3ilxzcrfZFBUOMm8m8G0gILwn66XwvY3A=w240-h480-rw",
};

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

const AGENT_PROTOCOL: Record<string, string> = {
  aave:    "Aave v3 · USDC supply",
  uniswap: "Uniswap V3 · USDC/ETH LP",
  perp:    "Hyperliquid · BTC perp funding",
};

function usd(n: number, dp = 0) {
  return "$" + n.toLocaleString(undefined, { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [kpis, setKpis] = useState<SwarmKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [portRes, venuesRes, kpisRes] = await Promise.all([
          fetch("/api/treasury"),
          fetch("/api/venues"),
          fetch("/api/kpis"),
        ]);
        const portData = await portRes.json();
        const venuesData = await venuesRes.json();
        const kpisData = await kpisRes.json();
        setPortfolio(portData.portfolio ?? null);
        setAgents(venuesData.agents ?? []);
        setKpis(kpisData.kpis ?? null);
      } finally {
        setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 9000);
    return () => clearInterval(id);
  }, []);

  const subAgents = agents.filter((a) => a.role !== "master");
  const totalDeployed = portfolio?.deployedUsdc ?? 0;

  return (
    <div className="page-content">
      {/* Top KPI row */}
      <div className="grid-cols-4" style={{ marginBottom: 16 }}>
        {[
          { label: "Total cap (ERC-7715)", value: portfolio ? usd(portfolio.totalUsdc) : "—", hint: "granted by wallet to orchestrator" },
          { label: "Deployed", value: portfolio ? usd(portfolio.deployedUsdc) : "—", hint: "USDC actively earning yield" },
          { label: "Idle", value: portfolio ? usd(portfolio.idleUsdc) : "—", hint: "undeployed buffer" },
          { label: "Estimated weekly yield", value: portfolio ? usd(portfolio.weeklyYieldUsdc, 2) : "—", hint: `avg ${kpis ? (kpis.avgApyBps / 100).toFixed(2) : "—"}% APY` },
        ].map((t) => (
          <div key={t.label} className="kpi-card">
            <div className="kpi-label">{t.label}</div>
            <div className="kpi-value">{t.value}</div>
            <div className="kpi-hint">{t.hint}</div>
          </div>
        ))}
      </div>

      {/* Allocation bar */}
      {portfolio && (
        <div className="card" style={{ padding: "20px 24px", marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 14 }}>Capital allocation</div>
          <div style={{ display: "flex", width: "100%", height: 12, overflow: "hidden", border: "1px solid var(--border)", borderRadius: 0 }}>
            {Object.entries(portfolio.byAgent).map(([id, val]) => (
              <div
                key={id}
                title={`${AGENT_LABEL[id] ?? id}: ${usd(val)}`}
                style={{ width: `${(val / (portfolio.totalUsdc || 1)) * 100}%`, background: AGENT_COLOR[id] ?? "#999", transition: "width 0.4s ease" }}
              />
            ))}
            <div
              style={{ flex: 1, background: "var(--bg-surface)" }}
              title={`Idle: ${usd(portfolio.idleUsdc)}`}
            />
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 10, flexWrap: "wrap" }}>
            {Object.entries(portfolio.byAgent).map(([id, val]) => (
              <div key={id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, background: AGENT_COLOR[id] ?? "#999", display: "inline-block" }} />
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{AGENT_LABEL[id] ?? id}</span>
                <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, color: "var(--text-muted)" }}>{usd(val)}</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, background: "var(--bg-surface)", border: "1px solid var(--border)", display: "inline-block" }} />
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Idle</span>
              <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, color: "var(--text-muted)" }}>{usd(portfolio.idleUsdc)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Per-agent cards */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Loading…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {subAgents.map((agent) => {
            const deployed = portfolio?.byAgent[agent.id] ?? agent.deployedUsdc;
            const allocPct = totalDeployed > 0 ? ((deployed / totalDeployed) * 100).toFixed(1) : "0";
            const color = AGENT_COLOR[agent.id] ?? "#0001FC";
            const logo = PROTOCOL_LOGO[agent.id] ?? "";
            const dailyYield = deployed * (agent.currentApyBps / 10_000) / 365;
            const weeklyYield = dailyYield * 7;

            return (
              <div key={agent.id} className="card" style={{ padding: 0, overflow: "hidden", borderTop: `3px solid ${color}` }}>
                <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, overflow: "hidden", background: "var(--bg-surface)", border: "1px solid var(--border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {logo ? (
                      <Image src={logo} alt={agent.name} width={32} height={32} style={{ objectFit: "contain" }} unoptimized />
                    ) : (
                      <span style={{ fontSize: 16, fontWeight: 700, color }}>{agent.name[0]}</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{agent.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{AGENT_PROTOCOL[agent.id] ?? agent.protocol}</div>
                  </div>
                  <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 18, fontWeight: 800, color }}>
                    {(agent.currentApyBps / 100).toFixed(2)}%
                  </div>
                </div>

                <div style={{ padding: "14px 20px 18px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>Deployed</div>
                      <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginTop: 3 }}>{usd(deployed)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>Total earned</div>
                      <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 15, fontWeight: 700, color: "var(--green)", marginTop: 3 }}>+{usd(agent.earnedUsdc, 2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>Daily yield</div>
                      <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginTop: 3 }}>{usd(dailyYield, 2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>Weekly yield</div>
                      <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginTop: 3 }}>{usd(weeklyYield, 2)}</div>
                    </div>
                  </div>

                  {/* Allocation bar */}
                  <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                    <span>Portfolio allocation</span>
                    <span style={{ color, fontWeight: 700 }}>{allocPct}%</span>
                  </div>
                  <div style={{ height: 5, background: "var(--border)", borderRadius: 0 }}>
                    <div style={{ height: "100%", width: `${allocPct}%`, background: color, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Total yield summary */}
      {portfolio && (
        <div className="card" style={{ padding: "20px 24px", marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="kpi-label">Total yield earned (all agents)</div>
            <div className="kpi-value" style={{ fontSize: 28, color: "var(--green)" }}>+{usd(portfolio.totalYieldUsdc, 2)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="kpi-label">Estimated annual (at current APY)</div>
            <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginTop: 4 }}>
              {usd(portfolio.weeklyYieldUsdc * 52, 0)} / year
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
