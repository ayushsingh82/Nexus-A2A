import ScanButton from "@/components/ScanButton";
import { getKpis, listExecutions } from "@/graph/store";
import type { Execution } from "@/graph/types";
import { explorerTx } from "@/lib/arc";

export const dynamic = "force-dynamic";

export default function ExecutionsPage() {
  const executions = listExecutions(100);
  const kpis = getKpis();
  const successes = executions.filter((e) => e.success).length;
  const totalPnl = executions.reduce((s, e) => s + e.realizedUsdc, 0);
  const totalVol = executions.reduce((s, e) => s + e.sizeUsdc, 0);
  const avgLatency =
    executions.length > 0
      ? Math.round(executions.reduce((s, e) => s + e.latencyMs, 0) / executions.length)
      : 0;

  return (
    <div className="page-content">
      <section className="card" style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="section-title">Executions</div>
          <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 4 }}>
            Every captured arb. Onchain receipt on Arc · settled in USDC.
          </div>
        </div>
        <ScanButton />
      </section>

      <div className="grid-cols-4" style={{ marginTop: 16 }}>
        <Tile label="Captured" value={kpis.opportunitiesCaptured.toString()} hint={`${successes}/${executions.length} successful`} />
        <Tile label="Realised PnL" value={`$${totalPnl.toFixed(2)}`} hint="net of fees + slippage" accent={totalPnl > 0} />
        <Tile label="Volume" value={`$${totalVol.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} hint="cumulative" />
        <Tile label="Avg latency" value={`${avgLatency}ms`} hint="first leg → settle" />
      </div>

      <section className="card" style={{ padding: 0, marginTop: 16, overflow: "hidden" }}>
        <header
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div className="section-title">Recent receipts</div>
          <span style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            last {executions.length}
          </span>
        </header>
        {executions.length === 0 ? (
          <Empty />
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {executions.map((e) => (
              <Row key={e.id} e={e} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Row({ e }: { e: Execution }) {
  return (
    <li
      style={{
        display: "grid",
        gridTemplateColumns: "100px 1fr 110px 92px 80px 110px",
        gap: 12,
        alignItems: "center",
        padding: "12px 20px",
        borderBottom: "1px solid var(--border)",
        fontSize: 12.5,
      }}
    >
      <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)" }}>{timeAgo(e.atMs)}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-primary)" }}>{e.cycleString}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          {e.venueString} ·{" "}
          <a
            href={explorerTx(stripDots(e.txHash))}
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--teal-text)", textDecoration: "none", fontFamily: "var(--font-geist-mono)" }}
          >
            {e.txHash}
          </a>
        </div>
      </div>
      <span
        style={{
          fontFamily: "var(--font-geist-mono)",
          textAlign: "right",
          color: e.realizedUsdc >= 0 ? "var(--green)" : "var(--red)",
          fontWeight: 600,
        }}
      >
        {e.realizedUsdc >= 0 ? "+" : ""}${e.realizedUsdc.toFixed(2)}
      </span>
      <span style={{ fontFamily: "var(--font-geist-mono)", textAlign: "right", color: "var(--text-secondary)" }}>
        +{e.netBps.toFixed(1)} bps
      </span>
      <span style={{ fontFamily: "var(--font-geist-mono)", textAlign: "right", color: "var(--text-secondary)" }}>
        ${e.sizeUsdc.toLocaleString()}
      </span>
      <span style={{ fontFamily: "var(--font-geist-mono)", textAlign: "right", color: "var(--text-muted)" }}>
        {e.latencyMs}ms
      </span>
    </li>
  );
}

function Tile({ label, value, hint, accent }: { label: string; value: string; hint: string; accent?: boolean }) {
  return (
    <div className="kpi-card" style={{ borderColor: accent ? "rgba(1, 183, 62, 0.18)" : "var(--border)" }}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color: accent ? "var(--teal-text)" : "var(--text-primary)" }}>{value}</div>
      <div className="kpi-hint">{hint}</div>
    </div>
  );
}

function Empty() {
  return (
    <div style={{ padding: "44px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
      No executions yet. Trigger a scan — the top cycle will be opportunistically captured.
    </div>
  );
}

function stripDots(s: string): string {
  return s.endsWith("…") ? s.slice(0, -1) : s;
}

function timeAgo(ms: number): string {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}
