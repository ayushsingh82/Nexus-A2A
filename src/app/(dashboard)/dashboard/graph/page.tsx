import RouteGraphCanvas from "@/components/RouteGraphCanvas";
import ScanButton from "@/components/ScanButton";
import { listEdges, listOpportunities, listVenues } from "@/graph/store";
import type { PriceEdge } from "@/graph/types";

export const dynamic = "force-dynamic";

export default function GraphPage() {
  const edges = listEdges();
  const venues = listVenues();
  const opps = listOpportunities(20);

  const tokens = Array.from(new Set(edges.flatMap((e) => [e.from, e.to])));
  const tokensByVenue: Record<string, PriceEdge[]> = {};
  for (const e of edges) {
    (tokensByVenue[e.venueId] ??= []).push(e);
  }

  return (
    <div className="page-content">
      <section
        className="card"
        style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}
      >
        <div>
          <div className="section-title">Route graph</div>
          <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 4 }}>
            {tokens.length} tokens · {edges.length} directed edges · {venues.length} venues.
            Negative-cycle search runs on <code>−log(rate × (1 − fee))</code>.
          </div>
        </div>
        <ScanButton />
      </section>

      <section className="card" style={{ padding: 0, marginTop: 16, overflow: "hidden" }}>
        <header style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <div className="section-title">Live graph view</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Token ring with every tradable edge. The best negative cycle is drawn
            in green with USDC flowing the loop.
          </div>
        </header>
        <div style={{ padding: "10px 14px 16px" }}>
          <RouteGraphCanvas edges={edges} cycle={opps[0]?.cycle} />
        </div>
      </section>

      <section className="card" style={{ padding: 0, marginTop: 16, overflow: "hidden" }}>
        <header style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <div className="section-title">Tokens in graph</div>
        </header>
        <div style={{ padding: "16px 20px", display: "flex", flexWrap: "wrap", gap: 10 }}>
          {tokens.length === 0 && (
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              No tokens yet — run a scan to populate the graph from live prices.
            </span>
          )}
          {tokens.map((t) => (
            <span
              key={t}
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: 13,
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: 999,
                background: t === "USDC" ? "rgba(1, 183, 62, 0.12)" : "var(--bg-surface)",
                color: t === "USDC" ? "var(--teal-text)" : "var(--text-primary)",
                border: "1px solid",
                borderColor: t === "USDC" ? "rgba(1, 183, 62, 0.32)" : "var(--border-strong)",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      <section className="card" style={{ padding: 0, marginTop: 16, overflow: "hidden" }}>
        <header style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <div className="section-title">Directed edges</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Edges in both directions are stored separately — the search treats <code>USDC → ETH</code> and <code>ETH → USDC</code> as independent.
          </div>
        </header>
        {edges.length === 0 ? (
          <Empty />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-surface)" }}>
                <Th>From</Th>
                <Th>To</Th>
                <Th>Venue</Th>
                <Th align="right">Rate</Th>
                <Th align="right">Fee</Th>
                <Th align="right">Liquidity</Th>
                <Th align="right">Updated</Th>
              </tr>
            </thead>
            <tbody>
              {edges
                .slice()
                .sort((a, b) =>
                  a.from === b.from
                    ? a.to === b.to
                      ? a.venueId.localeCompare(b.venueId)
                      : a.to.localeCompare(b.to)
                    : a.from.localeCompare(b.from),
                )
                .map((e, i) => (
                  <tr key={i}>
                    <Td>{e.from}</Td>
                    <Td>{e.to}</Td>
                    <Td mono>{e.venueId}</Td>
                    <Td mono align="right">
                      {e.rate >= 1
                        ? e.rate.toLocaleString(undefined, { maximumFractionDigits: 4 })
                        : e.rate.toExponential(4)}
                    </Td>
                    <Td mono align="right">{e.feeBps} bps</Td>
                    <Td mono align="right">${e.liquidityUsdc.toLocaleString()}</Td>
                    <Td mono align="right">{ageSec(e.updatedAtMs)}s</Td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card" style={{ padding: 0, marginTop: 16, overflow: "hidden" }}>
        <header style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <div className="section-title">Negative cycles found (this scan)</div>
        </header>
        {opps.length === 0 ? (
          <Empty />
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {opps.map((o) => (
              <li
                key={o.id}
                style={{
                  padding: "12px 20px",
                  borderBottom: "1px solid var(--border)",
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto auto",
                  gap: 14,
                  alignItems: "center",
                  fontSize: 12.5,
                }}
              >
                <span style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)" }}>{o.id}</span>
                <div>
                  <div style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-primary)" }}>
                    {o.cycle.nodes.join(" → ")}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    via {o.cycle.edges.map((e) => e.venueId).join(" ▸ ")} · liq floor ${o.cycle.liquidityFloorUsdc.toLocaleString()}
                  </div>
                </div>
                <span style={{ fontFamily: "var(--font-geist-mono)", color: "var(--teal-text)", fontWeight: 700 }}>
                  +{o.cycle.netBps.toFixed(1)} bps
                </span>
                <span style={{ fontFamily: "var(--font-geist-mono)", color: "var(--green)" }}>
                  +${o.expectedProfitUsdc.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Empty() {
  return (
    <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
      Empty. Click <em>Run scan</em> above to fetch live prices and rebuild the graph.
    </div>
  );
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

function Td({ children, mono, align }: { children: React.ReactNode; mono?: boolean; align?: "right" }) {
  return (
    <td
      style={{
        padding: "10px 20px",
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
