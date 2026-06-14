"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Agent, Delegation } from "@/agents/types";

const PROTOCOL_LOGO: Record<string, string> = {
  master:         "/logos/metamask.svg",
  aave:           "https://www.datocms-assets.com/166214/1758974929-1740700991-78b3ef2e096b-aave_logo.png?auto=format&fit=max&w=1200",
  uniswap:        "/logos/uniswap.svg",
  "uniswap-lp":   "/logos/uniswap.svg",
  perp:           "https://play-lh.googleusercontent.com/u-5f4DodeNbu-GykUJJ2fxVoLqLWaCwbTebu7ecgsXFmXzLOCwX_2C3ilxzcrfZFBUOMm8m8G0gILwn66XwvY3A=w240-h480-rw",
  "perp-funding": "https://play-lh.googleusercontent.com/u-5f4DodeNbu-GykUJJ2fxVoLqLWaCwbTebu7ecgsXFmXzLOCwX_2C3ilxzcrfZFBUOMm8m8G0gILwn66XwvY3A=w240-h480-rw",
};

const ROLE_COLOR: Record<string, string> = {
  master: "#0001FC",
  aave: "#B6509E",
  "uniswap-lp": "#FF007A",
  "perp-funding": "#0891b2",
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  active:      { bg: "rgba(34,197,94,0.12)",  color: "#15803d" },
  idle:        { bg: "rgba(0,0,0,0.06)",       color: "#6b7280" },
  deploying:   { bg: "rgba(245,158,11,0.12)",  color: "#b45309" },
  rebalancing: { bg: "rgba(124,58,237,0.12)",  color: "#5b21b6" },
  scanning:    { bg: "rgba(37,99,235,0.12)",   color: "#1d4ed8" },
};

function usd(n: number) {
  return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="page-content">
      <section className="card" style={{ padding: 20 }}>
        <div className="section-title">Agent Registry</div>
        <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 4 }}>
          Master orchestrator (ERC-7715) + 3 ERC-7710 subdelegated sub-agents · live on Base Sepolia
        </div>
      </section>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Loading agents…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 16 }}>
          {agents.map((agent) => {
            const del = delegations.find((d) => d.to === agent.role);
            const s = STATUS_STYLE[agent.status] ?? STATUS_STYLE.idle;
            const logoSrc = PROTOCOL_LOGO[agent.role] ?? PROTOCOL_LOGO[agent.id] ?? "";
            const accentColor = ROLE_COLOR[agent.role] ?? "#0001FC";
            const utilPct = del ? ((del.usedUsdc / del.capUsdc) * 100).toFixed(0) : null;

            return (
              <div key={agent.id} className="card" style={{ padding: 0, overflow: "hidden", borderTop: `3px solid ${accentColor}` }}>
                {/* Card header */}
                <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, overflow: "hidden", background: "var(--bg-surface)", border: "1px solid var(--border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {logoSrc ? (
                      <Image src={logoSrc} alt={agent.name} width={36} height={36} style={{ objectFit: "contain" }} unoptimized />
                    ) : (
                      <span style={{ fontSize: 18, fontWeight: 700, color: accentColor }}>
                        {agent.name[0]}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", lineHeight: 1.2 }}>{agent.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, fontFamily: "var(--font-geist-mono)" }}>
                      {agent.protocol} · {agent.chain}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", padding: "4px 10px", background: s.bg, color: s.color, flexShrink: 0 }}>
                    {agent.status}
                  </span>
                </div>

                {/* Stats grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                  {[
                    { label: "Delegated Cap", value: usd(agent.delegatedCapUsdc), accent: false },
                    { label: "APY", value: agent.currentApyBps > 0 ? `${(agent.currentApyBps / 100).toFixed(2)}%` : "—", accent: agent.currentApyBps > 0 },
                    { label: "Deployed", value: usd(agent.deployedUsdc), accent: false },
                    { label: "Earned", value: agent.earnedUsdc > 0 ? `+${usd(agent.earnedUsdc)}` : "—", accent: agent.earnedUsdc > 0 },
                  ].map((stat, i) => (
                    <div key={stat.label} style={{ padding: "12px 16px", borderBottom: i < 2 ? "1px solid var(--border)" : "none", borderRight: i % 2 === 0 ? "1px solid var(--border)" : "none" }}>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>{stat.label}</div>
                      <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 14, fontWeight: 700, color: stat.accent ? "var(--teal-text)" : "var(--text-primary)", marginTop: 4 }}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delegation badge */}
                {del && (
                  <div style={{ padding: "10px 16px", background: "var(--bg-surface)", borderTop: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)" }}>
                      <span>{del.id} · ERC-7710</span>
                      <span style={{ color: accentColor, fontWeight: 700 }}>{utilPct}% utilized</span>
                    </div>
                    <div style={{ marginTop: 6, height: 3, background: "var(--border)", borderRadius: 0 }}>
                      <div style={{ height: "100%", width: `${utilPct}%`, background: accentColor, transition: "width 0.4s ease" }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
