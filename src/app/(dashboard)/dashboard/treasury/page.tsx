import { getTreasury, listVenues } from "@/graph/store";
import { ARC_TESTNET_FAUCET } from "@/lib/arc";

export const dynamic = "force-dynamic";

export default function TreasuryPage() {
  const treasury = getTreasury();
  const venues = listVenues();
  const total = treasury.usdcWorking + treasury.usycParked + treasury.eurcWorking;

  return (
    <div className="page-content">
      <section className="card" style={{ padding: 24 }}>
        <div className="section-title">Treasury</div>
        <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 4 }}>
          Circle Gateway unified balance · USDC working float, USYC parking, EURC for FX legs.
          Until Circle Wallets are provisioned (see <a href="/dashboard/wallets" style={{ color: "var(--teal-text)" }}>Wallets</a>),
          this is synthesized for visualization.
        </div>

        <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <Tile label="Unified balance" value={`$${total.toLocaleString()}`} accent />
          <Tile label="Working USDC" value={`$${treasury.usdcWorking.toLocaleString()}`} />
          <Tile label="USYC parked" value={`$${treasury.usycParked.toLocaleString()}`} hint="idle yield" />
          <Tile label="EURC" value={`$${treasury.eurcWorking.toLocaleString()}`} hint="FX-aware nodes" />
        </div>
      </section>

      <section className="card" style={{ padding: 0, marginTop: 16, overflow: "hidden" }}>
        <header style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div className="section-title">Per-venue working capital</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            One Circle Wallet per venue. Routes pull from the unified balance via Gateway.
          </div>
        </header>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-surface)" }}>
              <Th>Venue</Th>
              <Th>Chain</Th>
              <Th>Kind</Th>
              <Th align="right">Working USDC</Th>
              <Th align="right">Share</Th>
            </tr>
          </thead>
          <tbody>
            {venues.map((v) => {
              const bal = treasury.usdcByVenue[v.id] ?? 0;
              const share = treasury.usdcWorking > 0 ? (bal / treasury.usdcWorking) * 100 : 0;
              return (
                <tr key={v.id}>
                  <Td>{v.name}</Td>
                  <Td mono>{v.chain.toLowerCase()}</Td>
                  <Td mono>{v.kind}</Td>
                  <Td mono align="right">${bal.toLocaleString()}</Td>
                  <Td mono align="right">{share.toFixed(0)}%</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="card" style={{ padding: 24, marginTop: 16, background: "rgba(1,183,62,0.04)" }}>
        <div className="section-title">Fund Argo on Arc Testnet</div>
        <p style={{ marginTop: 6, fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Argo&apos;s wallets receive USDC and EURC on Arc Testnet. To fund them:
        </p>
        <ol style={{ marginTop: 10, paddingLeft: 22, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
          <li>Open the <a href="/dashboard/wallets" style={{ color: "var(--teal-text)" }}>Wallets page</a> and click <em>Provision Circle Wallets</em>.</li>
          <li>Copy each address.</li>
          <li>Visit <a href={ARC_TESTNET_FAUCET} target="_blank" rel="noreferrer" style={{ color: "var(--teal-text)" }}>{ARC_TESTNET_FAUCET}</a> and request USDC + EURC for each.</li>
          <li>Run a scan — the agent picks up the new balances on the next tick.</li>
        </ol>
      </section>
    </div>
  );
}

function Tile({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div
      className="kpi-card"
      style={{ borderColor: accent ? "rgba(1, 183, 62, 0.18)" : "var(--border)" }}
    >
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color: accent ? "var(--teal-text)" : "var(--text-primary)" }}>{value}</div>
      {hint && <div className="kpi-hint">{hint}</div>}
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th
      style={{
        textAlign: align ?? "left",
        padding: "10px 20px",
        fontSize: 11,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--text-muted)",
        fontWeight: 600,
        borderBottom: "1px solid var(--border)",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, mono, align }: { children: React.ReactNode; mono?: boolean; align?: "right" }) {
  return (
    <td
      style={{
        padding: "11px 20px",
        fontSize: 12.5,
        textAlign: align ?? "left",
        color: mono ? "var(--text-secondary)" : "var(--text-primary)",
        fontFamily: mono ? "var(--font-geist-mono)" : undefined,
        borderBottom: "1px solid var(--border)",
      }}
    >
      {children}
    </td>
  );
}
