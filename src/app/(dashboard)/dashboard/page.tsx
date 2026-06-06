import {
  executions,
  kpis,
  opportunities,
  venues,
  wallets,
} from "@/lib/mock-arb";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div className="page-content">
      <KpiRow />
      <OpportunitiesPanel />
      <div className="grid-cols-3" style={{ marginTop: 18, gridTemplateColumns: "1.6fr 1fr" }}>
        <ExecutionsPanel />
        <TreasuryPanel />
      </div>
      <VenuesPanel />
    </div>
  );
}

function KpiRow() {
  const tiles = [
    { label: "Opportunities scanned", value: kpis.opportunitiesScanned.toLocaleString(), hint: "last 24h" },
    { label: "Captured", value: kpis.opportunitiesCaptured.toString(), hint: `${Math.round(kpis.successRate * 100)}% success` },
    { label: "Net profit", value: `$${kpis.totalProfitUsdc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, hint: "USDC · lifetime" },
    { label: "Avg execution", value: `${kpis.avgLatencyMs}ms`, hint: "first leg → settle" },
  ];
  return (
    <div className="grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="kpi-card">
          <div className="kpi-label">{t.label}</div>
          <div className="kpi-value">{t.value}</div>
          <div className="kpi-hint">{t.hint}</div>
        </div>
      ))}
    </div>
  );
}

function OpportunitiesPanel() {
  return (
    <div className="card" style={{ marginTop: 18 }}>
      <div className="section-header">
        <div>
          <div className="section-title">Live opportunities</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Negative-cycle candidates currently above profit threshold (5 bps net).
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button className="btn-neutral-outline" style={{ padding: "5px 12px", fontSize: 12 }}>
            ⟳ Rescan
          </button>
          <button className="btn-brand-outline" style={{ padding: "5px 14px", fontSize: 12 }}>
            Execute top →
          </button>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cycle</th>
              <th>Venues</th>
              <th style={{ textAlign: "right" }}>Net bps</th>
              <th style={{ textAlign: "right" }}>Est. profit</th>
              <th style={{ textAlign: "right" }}>Size</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((o) => (
              <tr key={o.id}>
                <td className="font-mono" style={{ color: "var(--text-primary)" }}>{o.id}</td>
                <td>
                  <span className="font-mono" style={{ fontSize: 12.5 }}>{o.cycle.join(" → ")}</span>
                </td>
                <td>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {o.venues.join(" · ")}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <span className={o.netBps >= 8 ? "chip chip-green" : "chip chip-blue"}>
                    {o.netBps.toFixed(1)}
                  </span>
                </td>
                <td className="font-mono" style={{ textAlign: "right", color: "var(--green)" }}>
                  +${o.expectedProfitUsdc.toFixed(2)}
                </td>
                <td className="font-mono" style={{ textAlign: "right" }}>
                  ${o.sizeUsdc.toLocaleString()}
                </td>
                <td>
                  <span className={`chip ${o.status === "executing" ? "chip-amber" : o.status === "queued" ? "chip-blue" : "chip-gray"}`}>
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExecutionsPanel() {
  return (
    <div className="card">
      <div className="section-header">
        <div>
          <div className="section-title">Recent executions</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Each row is an onchain receipt on Arc.
          </div>
        </div>
        <span style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          last 5 min
        </span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Cycle</th>
              <th>Venues</th>
              <th style={{ textAlign: "right" }}>Size</th>
              <th style={{ textAlign: "right" }}>P&amp;L</th>
              <th style={{ textAlign: "right" }}>Latency</th>
            </tr>
          </thead>
          <tbody>
            {executions.map((e) => (
              <tr key={e.id}>
                <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{e.at}</td>
                <td className="font-mono" style={{ fontSize: 12.5 }}>{e.cycle}</td>
                <td style={{ fontSize: 12 }}>{e.venues}</td>
                <td className="font-mono" style={{ textAlign: "right" }}>
                  ${e.sizeUsdc.toLocaleString()}
                </td>
                <td
                  className="font-mono"
                  style={{
                    textAlign: "right",
                    color: e.realizedUsdc >= 0 ? "var(--green)" : "var(--red)",
                    fontWeight: 600,
                  }}
                >
                  {e.realizedUsdc >= 0 ? "+" : ""}${e.realizedUsdc.toFixed(2)}
                </td>
                <td className="font-mono" style={{ textAlign: "right", color: "var(--text-muted)" }}>
                  {e.latencyMs}ms
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TreasuryPanel() {
  return (
    <div className="card">
      <div className="section-header">
        <div>
          <div className="section-title">Treasury</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Circle Gateway unified balance.
          </div>
        </div>
      </div>

      <div style={{ marginTop: 4 }}>
        <div className="kpi-label">Unified balance</div>
        <div className="kpi-value" style={{ fontSize: 32 }}>
          ${kpis.unifiedBalance.toLocaleString()}
        </div>
        <div className="kpi-hint">across {wallets.length} venue wallets + USYC</div>
      </div>

      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
        <TreasuryRow
          label="Working USDC"
          value={`$${kpis.treasuryUsdc.toLocaleString()}`}
          hint="liquid across venue wallets"
        />
        <TreasuryRow
          label="USYC parked"
          value={`$${kpis.usycParked.toLocaleString()}`}
          hint="idle, earning yield"
          accent
        />
      </div>

      <div style={{ marginTop: 18 }}>
        <div className="nav-section-label" style={{ padding: 0, marginBottom: 8 }}>
          Circle stack
        </div>
        <div className="flex flex-wrap" style={{ gap: 6 }}>
          {["Wallets", "USDC", "EURC", "USYC", "Gateway", "CCTP", "Paymaster", "Contracts"].map((p) => (
            <span key={p} className="chip chip-gray">
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TreasuryRow({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 14px",
        border: "1px solid var(--border)",
        borderRadius: 10,
        background: accent ? "rgba(1, 183, 62, 0.04)" : "var(--bg-surface)",
      }}
    >
      <div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.04em" }}>
          {label}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{hint}</div>
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: accent ? "var(--teal-text)" : "var(--text-primary)",
          fontFamily: "var(--font-geist-mono)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function VenuesPanel() {
  return (
    <div className="card" style={{ marginTop: 18 }}>
      <div className="section-header">
        <div>
          <div className="section-title">Monitored venues</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Each venue is a node in Argo&apos;s live price graph.
          </div>
        </div>
        <span style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {venues.length} nodes · {wallets.filter((w) => w.address !== "—").length} wallets
        </span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Venue</th>
              <th>Chain</th>
              <th>Kind</th>
              <th>Wallet</th>
              <th style={{ textAlign: "right" }}>USDC</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {venues.map((v) => {
              const w = wallets.find((x) => x.venue.startsWith(v.name) && x.chain === v.chain) ?? wallets.find((x) => x.chain === v.chain);
              return (
                <tr key={v.id}>
                  <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{v.name}</td>
                  <td className="font-mono" style={{ fontSize: 12 }}>{v.chain}</td>
                  <td><span className="chip chip-gray">{v.kind}</span></td>
                  <td className="font-mono" style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                    {w?.address ?? "—"}
                  </td>
                  <td className="font-mono" style={{ textAlign: "right" }}>
                    ${(w?.usdcBalance ?? 0).toLocaleString()}
                  </td>
                  <td>
                    <span className="dot dot-green" /> <span style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 6 }}>active</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
