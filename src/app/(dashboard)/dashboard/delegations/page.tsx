"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { Agent, Delegation } from "@/agents/types";

const PROTOCOL_LOGO: Record<string, string> = {
  aave:           "https://www.datocms-assets.com/166214/1758974929-1740700991-78b3ef2e096b-aave_logo.png?auto=format&fit=max&w=1200",
  "uniswap-lp":   "/logos/uniswap.svg",
  "perp-funding": "https://play-lh.googleusercontent.com/u-5f4DodeNbu-GykUJJ2fxVoLqLWaCwbTebu7ecgsXFmXzLOCwX_2C3ilxzcrfZFBUOMm8m8G0gILwn66XwvY3A=w240-h480-rw",
  master:         "/logos/metamask.svg",
};

const DelegationFlow = dynamic(() => import("@/components/DelegationFlow"), { ssr: false });

function usd(n: number) {
  return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function relDate(ms: number) {
  const days = Math.round((ms - Date.now()) / 86_400_000);
  if (days > 0) return `in ${days}d`;
  return `${Math.abs(days)}d ago`;
}

const STATUS_COLOR: Record<string, string> = {
  active:  "#15803d",
  consumed: "#b45309",
  revoked:  "#dc2626",
};

const TO_COLOR: Record<string, string> = {
  aave:          "#B6509E",
  "uniswap-lp":  "#FF007A",
  "perp-funding": "#0891b2",
};

export default function DelegationsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(true);

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

  const activeDels = delegations.filter((d) => d.status === "active");
  const totalCap = delegations.reduce((s, d) => s + d.capUsdc, 0);
  const totalUsed = delegations.reduce((s, d) => s + d.usedUsdc, 0);

  return (
    <div className="page-content">
      {/* Header stats */}
      <div className="grid-cols-4" style={{ marginBottom: 16 }}>
        {[
          { label: "Total delegations", value: delegations.length.toString(), hint: "ERC-7710 subdelegations" },
          { label: "Active", value: activeDels.length.toString(), hint: "from master orchestrator" },
          { label: "Total cap", value: usd(totalCap), hint: "USDC across all delegations" },
          { label: "Total utilized", value: usd(totalUsed), hint: `${totalCap > 0 ? ((totalUsed / totalCap) * 100).toFixed(0) : 0}% of cap` },
        ].map((t) => (
          <div key={t.label} className="kpi-card">
            <div className="kpi-label">{t.label}</div>
            <div className="kpi-value">{t.value}</div>
            <div className="kpi-hint">{t.hint}</div>
          </div>
        ))}
      </div>

      {/* Flow visualization */}
      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="section-title">Capital Flow · ERC-7710 Subdelegation</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Orchestrator subdelegates USDC caps to each agent via ERC-7710
            </div>
          </div>
          <button
            onClick={() => setRunning((r) => !r)}
            style={{ fontSize: 11, fontWeight: 700, padding: "6px 14px", background: running ? "rgba(0,1,252,0.08)" : "var(--bg-surface)", border: "1px solid var(--border)", color: running ? "#0001FC" : "var(--text-muted)", cursor: "pointer", letterSpacing: "0.05em" }}
          >
            {running ? "⏸ Pause" : "▶ Play"}
          </button>
        </div>
        <div style={{ padding: "0 20px 16px" }}>
          {loading ? (
            <div style={{ height: 360, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>Loading…</div>
          ) : (
            <DelegationFlow agents={agents} delegations={delegations} running={running} />
          )}
        </div>
      </div>

      {/* Delegation table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <div className="section-title">Delegation details</div>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Loading…</div>
        ) : delegations.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No delegations found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-surface)" }}>
                {["ID", "From", "To Agent", "Cap (USDC)", "Utilized", "Utilization", "Permission", "Expires", "Status"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, borderBottom: "1px solid var(--border)", textAlign: "left", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {delegations.map((d) => {
                const utilPct = d.capUsdc > 0 ? (d.usedUsdc / d.capUsdc) * 100 : 0;
                const toAgent = agents.find((a) => a.role === d.to);
                const fromAgent = agents.find((a) => a.role === d.from);
                const accentColor = TO_COLOR[d.to] ?? "#0001FC";
                return (
                  <tr key={d.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 16px", fontFamily: "var(--font-geist-mono)", fontSize: 12, color: "#0001FC", fontWeight: 700 }}>{d.id}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--text-secondary)" }}>{fromAgent?.name ?? d.from}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        {PROTOCOL_LOGO[d.to] ? (
                          <span style={{ width: 18, height: 18, borderRadius: 5, overflow: "hidden", background: "var(--bg-surface)", border: "1px solid var(--border)", flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                            <Image src={PROTOCOL_LOGO[d.to]} alt={d.to} width={13} height={13} style={{ objectFit: "contain" }} unoptimized />
                          </span>
                        ) : (
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: accentColor, display: "inline-block" }} />
                        )}
                        {toAgent?.name ?? d.to}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "var(--font-geist-mono)", fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)" }}>{usd(d.capUsdc)}</td>
                    <td style={{ padding: "12px 16px", fontFamily: "var(--font-geist-mono)", fontSize: 12.5, color: "var(--text-secondary)" }}>{usd(d.usedUsdc)}</td>
                    <td style={{ padding: "12px 16px", minWidth: 120 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 4, background: "var(--border)", borderRadius: 0 }}>
                          <div style={{ height: "100%", width: `${utilPct}%`, background: accentColor, transition: "width 0.4s ease" }} />
                        </div>
                        <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: accentColor, fontWeight: 700, width: 32, textAlign: "right" }}>{utilPct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "var(--text-muted)" }}>{d.permissionType}</td>
                    <td style={{ padding: "12px 16px", fontFamily: "var(--font-geist-mono)", fontSize: 11.5, color: "var(--text-secondary)" }}>{relDate(d.expiresAtMs)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", padding: "3px 9px", color: STATUS_COLOR[d.status] ?? "var(--text-muted)", background: `${STATUS_COLOR[d.status] ?? "#888"}1a` }}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
