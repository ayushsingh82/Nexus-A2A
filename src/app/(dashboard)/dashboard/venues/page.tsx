import ScanButton from "@/components/ScanButton";
import { listEdges, listVenues } from "@/graph/store";
import type { PriceEdge, Venue } from "@/graph/types";

export const dynamic = "force-dynamic";

const VENUE_NOTES: Record<string, string> = {
  hl: "Hyperliquid perp mid via the public /info endpoint. USDC-quoted markets.",
  binance: "Binance spot /api/v3/ticker/price. USDT prices used as USDC proxy.",
  chainlink: "Chainlink Aggregator V3 latestRoundData() on Ethereum mainnet via public RPC.",
};

const VENUE_SOURCE: Record<string, string> = {
  hl: "POST api.hyperliquid.xyz/info {type:\"allMids\"}",
  binance: "GET api.binance.com/api/v3/ticker/price",
  chainlink: "eth_call latestRoundData() · ETH/USD, BTC/USD, EUR/USD",
};

export default function VenuesPage() {
  const venues = listVenues();
  const edges = listEdges();
  const byVenue = groupByVenue(edges);

  return (
    <div className="page-content">
      <section className="card" style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="section-title">Monitored venues</div>
          <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 4 }}>
            {venues.length} venues · {edges.length} edges · all sourced from public, no-auth endpoints.
          </div>
        </div>
        <ScanButton />
      </section>

      <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
        {venues.map((v) => {
          const vedges = byVenue[v.id] ?? [];
          return <VenueCard key={v.id} v={v} edges={vedges} />;
        })}
      </div>
    </div>
  );
}

function VenueCard({ v, edges }: { v: Venue; edges: PriceEdge[] }) {
  const pairs = pairsFromEdges(edges);
  const updatedAt = edges.reduce((m, e) => Math.max(m, e.updatedAtMs), 0);

  return (
    <section className="card" style={{ padding: 0, overflow: "hidden" }}>
      <header
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{v.name}</span>
            <span
              className="chip"
              style={{
                background:
                  v.kind === "DEX"
                    ? "rgba(1, 183, 62, 0.10)"
                    : v.kind === "PERP"
                      ? "rgba(124, 58, 237, 0.10)"
                      : "rgba(0, 0, 0, 0.05)",
                color:
                  v.kind === "DEX"
                    ? "var(--teal-text)"
                    : v.kind === "PERP"
                      ? "#5b21b6"
                      : "var(--text-secondary)",
              }}
            >
              {v.kind}
            </span>
            <span className="chip" style={{ background: "rgba(0,0,0,0.05)", color: "var(--text-secondary)" }}>
              {v.chain.toLowerCase()}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.55, maxWidth: 720 }}>
            {VENUE_NOTES[v.id] ?? "Public market data."}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="kpi-label" style={{ fontSize: 10.5 }}>Source</div>
          <code style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>{VENUE_SOURCE[v.id] ?? "—"}</code>
        </div>
      </header>

      {pairs.length === 0 ? (
        <div style={{ padding: 28, fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
          No live edges yet. Run a scan from the top to pull real prices.
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-surface)" }}>
              <Th>Pair</Th>
              <Th align="right">Mid (USDC)</Th>
              <Th align="right">Fee (bps)</Th>
              <Th align="right">Liquidity</Th>
              <Th align="right">Updated</Th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((p) => (
              <tr key={p.token}>
                <Td>USDC ↔ {p.token}</Td>
                <Td mono align="right">
                  {p.midUsdc > 0
                    ? p.midUsdc.toLocaleString(undefined, { maximumFractionDigits: 4 })
                    : "—"}
                </Td>
                <Td mono align="right">{p.feeBps}</Td>
                <Td mono align="right">${p.liquidity.toLocaleString()}</Td>
                <Td mono align="right">{ageSec(updatedAt)}s ago</Td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function groupByVenue(edges: PriceEdge[]): Record<string, PriceEdge[]> {
  const out: Record<string, PriceEdge[]> = {};
  for (const e of edges) {
    (out[e.venueId] ??= []).push(e);
  }
  return out;
}

function pairsFromEdges(edges: PriceEdge[]) {
  // each pair has both directions — surface the USDC→token direction as the mid
  const seen = new Set<string>();
  const out: { token: string; midUsdc: number; feeBps: number; liquidity: number }[] = [];
  for (const e of edges) {
    const token = e.from === "USDC" ? e.to : e.to === "USDC" ? e.from : null;
    if (!token || seen.has(token)) continue;
    seen.add(token);
    // find the inverse (token → USDC) for the more intuitive USDC-per-token price
    const back = edges.find((x) => x.from === token && x.to === "USDC");
    out.push({
      token,
      midUsdc: back ? back.rate : e.rate > 0 ? 1 / e.rate : 0,
      feeBps: e.feeBps,
      liquidity: e.liquidityUsdc,
    });
  }
  return out.sort((a, b) => a.token.localeCompare(b.token));
}

function ageSec(t: number): number {
  if (t === 0) return 0;
  return Math.max(0, Math.round((Date.now() - t) / 1000));
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

function Td({
  children,
  mono,
  align,
}: {
  children: React.ReactNode;
  mono?: boolean;
  align?: "right";
}) {
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
