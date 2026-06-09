"use client";

import { useEffect, useRef, useState } from "react";
import CaptureCycle from "@/components/CaptureCycle";
import PnlChart from "@/components/PnlChart";
import RouteGraphCanvas from "@/components/RouteGraphCanvas";
import StatusDot from "@/components/StatusDot";
import { timeAgo, useLiveData } from "@/lib/useLiveData";
import type {
  Execution,
  Opportunity,
  PriceEdge,
  SwarmKpis,
  Treasury,
  Venue,
} from "@/graph/types";

export type DashboardSnapshot = {
  kpis: SwarmKpis;
  opportunities: Opportunity[];
  treasury: Treasury;
  venues: Venue[];
  edges: PriceEdge[];
  executions: Execution[];
};

const AUTOPILOT_MS = 9000;

export default function LiveDashboard({ initial }: { initial: DashboardSnapshot }) {
  const kpisQ = useLiveData<{ kpis: SwarmKpis }>("/api/kpis", 7000, {
    initial: { kpis: initial.kpis },
  });
  const oppsQ = useLiveData<{ opportunities: Opportunity[] }>("/api/opportunities?limit=6", 7000, {
    initial: { opportunities: initial.opportunities },
  });
  const treasuryQ = useLiveData<{ treasury: Treasury }>("/api/treasury", 8000, {
    initial: { treasury: initial.treasury },
  });
  const venuesQ = useLiveData<{ venues: Venue[]; edges: PriceEdge[] }>("/api/venues", 7000, {
    initial: { venues: initial.venues, edges: initial.edges },
  });
  const execQ = useLiveData<{ executions: Execution[] }>("/api/executions?limit=10", 7000, {
    initial: { executions: initial.executions },
  });

  const kpis = kpisQ.data?.kpis ?? initial.kpis;
  const opportunities = oppsQ.data?.opportunities ?? initial.opportunities;
  const treasury = treasuryQ.data?.treasury ?? initial.treasury;
  const venues = venuesQ.data?.venues ?? initial.venues;
  const edges = venuesQ.data?.edges ?? initial.edges;
  const executions = execQ.data?.executions ?? initial.executions;

  const refreshAll = () => {
    kpisQ.refresh();
    oppsQ.refresh();
    treasuryQ.refresh();
    venuesQ.refresh();
    execQ.refresh();
  };
  const refreshRef = useRef(refreshAll);
  refreshRef.current = refreshAll;

  // ── Autopilot: scan real venues on a loop, then pull fresh state ──────────
  const [autopilot, setAutopilot] = useState(true);
  const scanning = useRef(false);
  useEffect(() => {
    if (!autopilot) return;
    const id = setInterval(async () => {
      if (scanning.current) return;
      scanning.current = true;
      try {
        await fetch("/api/scan", { method: "POST" });
        refreshRef.current();
      } catch {
        /* keep last-known state */
      } finally {
        scanning.current = false;
      }
    }, AUTOPILOT_MS);
    return () => clearInterval(id);
  }, [autopilot]);

  // 1s ticker so "last scan Ns ago" stays live
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const topCycle = opportunities[0]?.cycle;

  return (
    <div className="page-content">
      <ControlBar
        kpis={kpis}
        venueCount={venues.length}
        edgeCount={edges.length}
        autopilot={autopilot}
        onToggleAutopilot={() => setAutopilot((a) => !a)}
        onScanned={refreshAll}
        status={kpisQ.status}
        updatedAt={kpisQ.updatedAt}
      />

      <KpiRow kpis={kpis} />

      <div className="dash-2col" style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 16, marginTop: 18 }}>
        <Panel
          title="Live route graph"
          subtitle="Token ring · tradable edges · best negative cycle in green"
          status={venuesQ.status}
          updatedAt={venuesQ.updatedAt}
          source="venue graph"
        >
          <div style={{ padding: "8px 12px 14px" }}>
            <RouteGraphCanvas edges={edges} cycle={topCycle} />
          </div>
        </Panel>

        <TreasuryPanel treasury={treasury} status={treasuryQ.status} updatedAt={treasuryQ.updatedAt} />
      </div>

      <div className="dash-2col" style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 16, marginTop: 16 }}>
        <OpportunitiesPanel opportunities={opportunities} status={oppsQ.status} updatedAt={oppsQ.updatedAt} />
        <VenuesPanel venues={venues} edgeCount={edges.length} status={venuesQ.status} updatedAt={venuesQ.updatedAt} />
      </div>

      <div className="dash-2col" style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 16, marginTop: 16 }}>
        <ExecutionsPanel executions={executions} status={execQ.status} updatedAt={execQ.updatedAt} />
        <Panel
          title="Realized PnL"
          subtitle="Cumulative USDC captured across all settled cycles"
          status={execQ.status}
          updatedAt={execQ.updatedAt}
          source="settlements"
        >
          <div style={{ padding: "16px 18px 18px" }}>
            <div className="kpi-value" style={{ fontSize: 30 }}>
              ${kpis.totalProfitUsdc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="kpi-hint" style={{ marginBottom: 8 }}>
              {kpis.opportunitiesCaptured} captures · {(kpis.successRate * 100).toFixed(0)}% success
            </div>
            <PnlChart executions={executions} />
          </div>
        </Panel>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .dash-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

/* ── Control bar (status + autopilot + run cycle) ──────────────── */
function ControlBar({
  kpis,
  venueCount,
  edgeCount,
  autopilot,
  onToggleAutopilot,
  onScanned,
  status,
  updatedAt,
}: {
  kpis: SwarmKpis;
  venueCount: number;
  edgeCount: number;
  autopilot: boolean;
  onToggleAutopilot: () => void;
  onScanned: () => void;
  status: "loading" | "live" | "error";
  updatedAt: number;
}) {
  const lastScanAgo = kpis.lastScanAtMs ? timeAgo(kpis.lastScanAtMs) : "never";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
        padding: "14px 18px",
        border: "1px solid var(--border)",
        borderRadius: 12,
        background: "linear-gradient(180deg, rgba(1,183,62,0.04) 0%, var(--bg-elevated) 100%)",
        marginBottom: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <span className="live-pill">
          <span className="live-pill__dot" />
          {autopilot ? "autopilot · scanning" : "manual · paused"}
        </span>
        <span style={{ fontSize: 12.5, color: "var(--text-secondary)", fontFamily: "var(--font-geist-mono)" }}>
          last scan {lastScanAgo} · {kpis.cyclesAboveThreshold} cycle
          {kpis.cyclesAboveThreshold === 1 ? "" : "s"} above 5 bps · {venueCount} venues · {edgeCount} edges
        </span>
        <StatusDot status={status} updatedAt={updatedAt} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onToggleAutopilot}
          className={`argo-switch${autopilot ? " argo-switch--on" : ""}`}
          aria-pressed={autopilot}
          title="Toggle continuous scanning"
        >
          <span className="argo-switch__knob" />
          <span className="argo-switch__label">Autopilot</span>
        </button>
        <CaptureCycle onScanned={onScanned} />
      </div>
    </div>
  );
}

/* ── Reusable panel shell with status dot ──────────────────────── */
function Panel({
  title,
  subtitle,
  status,
  updatedAt,
  source,
  children,
}: {
  title: string;
  subtitle?: string;
  status: "loading" | "live" | "error";
  updatedAt: number;
  source?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div className="section-title">{title}</div>
          {subtitle && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{subtitle}</div>
          )}
        </div>
        <StatusDot status={status} updatedAt={updatedAt} source={source} />
      </div>
      {children}
    </div>
  );
}

/* ── KPI tiles ─────────────────────────────────────────────────── */
function KpiRow({ kpis }: { kpis: SwarmKpis }) {
  const tiles = [
    {
      label: "Opportunities scanned",
      value: kpis.opportunitiesScanned.toLocaleString(),
      hint: "since launch",
      bars: [18, 22, 26, 28, 31, 34, 38, 42, 47, 51, 56],
      accent: false,
    },
    {
      label: "Captured",
      value: kpis.opportunitiesCaptured.toString(),
      hint: `${(kpis.successRate * 100).toFixed(0)}% success rate`,
      bars: [2, 3, 5, 6, 5, 7, 8, 9, 11, 12, 13],
      accent: true,
    },
    {
      label: "Net profit",
      value: `$${kpis.totalProfitUsdc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      hint: `volume $${(kpis.totalVolumeUsdc / 1000).toFixed(0)}k`,
      bars: [5, 8, 9, 11, 14, 16, 17, 19, 21, 23, 26],
      accent: true,
    },
    {
      label: "Avg execution",
      value: `${kpis.avgLatencyMs}ms`,
      hint: "first leg → settle on Arc",
      bars: [22, 19, 21, 18, 17, 20, 16, 15, 17, 14, 13],
      accent: false,
    },
  ];
  return (
    <div className="grid-cols-4">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="kpi-card"
          style={{
            position: "relative",
            overflow: "hidden",
            borderColor: t.accent ? "rgba(1, 183, 62, 0.18)" : "var(--border)",
          }}
        >
          <div className="kpi-label">{t.label}</div>
          <div className="kpi-value" style={{ color: t.accent ? "var(--teal-text)" : "var(--text-primary)" }}>
            {t.value}
          </div>
          <div className="kpi-hint">{t.hint}</div>
          <Sparkline bars={t.bars} accent={t.accent} />
        </div>
      ))}
    </div>
  );
}

function Sparkline({ bars, accent }: { bars: number[]; accent: boolean }) {
  const max = Math.max(...bars);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, marginTop: 14, height: 32 }}>
      {bars.map((b, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${(b / max) * 100}%`,
            borderRadius: 1,
            background: accent ? "var(--brand-green)" : "var(--border-strong)",
            opacity: accent ? 0.85 - (bars.length - 1 - i) * 0.04 : 0.6 - (bars.length - 1 - i) * 0.03,
          }}
        />
      ))}
    </div>
  );
}

/* ── Opportunities ─────────────────────────────────────────────── */
function OpportunitiesPanel({
  opportunities,
  status,
  updatedAt,
}: {
  opportunities: Opportunity[];
  status: "loading" | "live" | "error";
  updatedAt: number;
}) {
  return (
    <Panel
      title="Live opportunities"
      subtitle="Negative-cycle candidates above 5 bps after fees and slippage"
      status={status}
      updatedAt={updatedAt}
      source="graph engine"
    >
      {opportunities.length === 0 ? (
        <EmptyState text="No opportunities above threshold yet. Autopilot is scanning…" />
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {opportunities.map((o) => (
            <OpportunityRow key={o.id} o={o} />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function OpportunityRow({ o }: { o: Opportunity }) {
  const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
    executing: { bg: "rgba(245,158,11,0.10)", color: "#b45309", label: "executing" },
    queued: { bg: "rgba(37,99,235,0.10)", color: "#1d4ed8", label: "queued" },
    candidate: { bg: "rgba(0,0,0,0.05)", color: "var(--text-secondary)", label: "candidate" },
    captured: { bg: "rgba(34,197,94,0.12)", color: "#15803d", label: "captured" },
    rejected: { bg: "rgba(239,68,68,0.10)", color: "#b91c1c", label: "rejected" },
  };
  const s = statusStyle[o.status] ?? statusStyle.candidate;
  return (
    <li
      style={{
        padding: "14px 20px",
        borderBottom: "1px solid var(--border)",
        display: "grid",
        gridTemplateColumns: "auto 1fr auto auto",
        gap: 16,
        alignItems: "center",
      }}
    >
      <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, color: "var(--text-muted)", minWidth: 80 }}>
        {o.id}
      </span>
      <div style={{ minWidth: 0 }}>
        <CycleVisual nodes={o.cycle.nodes} />
        <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 6, fontFamily: "var(--font-geist-mono)" }}>
          {o.cycle.edges.map((e) => e.venueId).join(" ▸ ")} · liq floor ${o.cycle.liquidityFloorUsdc.toLocaleString()}
        </div>
      </div>
      <div style={{ textAlign: "right", minWidth: 90 }}>
        <div
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 16,
            fontWeight: 700,
            color: o.cycle.netBps >= 10 ? "var(--teal-text)" : "var(--text-primary)",
          }}
        >
          +{o.cycle.netBps.toFixed(1)} bps
        </div>
        <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, color: "var(--green)", marginTop: 2 }}>
          +${o.expectedProfitUsdc.toFixed(2)}
        </div>
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          padding: "4px 10px",
          borderRadius: 999,
          background: s.bg,
          color: s.color,
          minWidth: 92,
          textAlign: "center",
        }}
      >
        {s.label}
      </span>
    </li>
  );
}

function CycleVisual({ nodes }: { nodes: string[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      {nodes.map((n, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 44,
              padding: "3px 10px",
              borderRadius: 6,
              background: i === 0 || i === nodes.length - 1 ? "rgba(1, 183, 62, 0.10)" : "var(--bg-surface)",
              border: "1px solid",
              borderColor: i === 0 || i === nodes.length - 1 ? "rgba(1, 183, 62, 0.32)" : "var(--border-strong)",
              fontFamily: "var(--font-geist-mono)",
              fontSize: 12,
              fontWeight: 600,
              color: i === 0 || i === nodes.length - 1 ? "var(--teal-text)" : "var(--text-primary)",
            }}
          >
            {n}
          </span>
          {i < nodes.length - 1 && <span style={{ color: "var(--text-muted)", fontSize: 13 }}>→</span>}
        </span>
      ))}
    </div>
  );
}

/* ── Treasury ──────────────────────────────────────────────────── */
function TreasuryPanel({
  treasury,
  status,
  updatedAt,
}: {
  treasury: Treasury;
  status: "loading" | "live" | "error";
  updatedAt: number;
}) {
  const working = treasury.usdcWorking;
  const parked = treasury.usycParked;
  const eurc = treasury.eurcWorking;
  const total = working + parked + eurc;
  return (
    <Panel
      title="Treasury"
      subtitle={`Circle Gateway · unified across ${Object.keys(treasury.usdcByVenue).length} venues`}
      status={status}
      updatedAt={updatedAt}
      source="gateway"
    >
      <div style={{ padding: "20px 20px 8px" }}>
        <div className="kpi-label">Unified balance</div>
        <div className="kpi-value" style={{ fontSize: 34 }}>
          ${total.toLocaleString()}
        </div>
        <div className="kpi-hint">working + USYC + EURC</div>
        <ProportionalBar
          segments={[
            { label: "Working USDC", value: working, color: "var(--brand-green)" },
            { label: "USYC", value: parked, color: "#1d4ed8" },
            { label: "EURC", value: eurc, color: "#d97706" },
          ]}
        />
      </div>
      <div style={{ padding: "12px 20px 20px" }}>
        <div className="nav-section-label" style={{ padding: 0, marginBottom: 8 }}>
          By venue (working USDC)
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {Object.entries(treasury.usdcByVenue).map(([venue, amount]) => (
            <li
              key={venue}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                fontSize: 12.5,
                borderBottom: "1px dashed var(--border)",
              }}
            >
              <span className="font-mono" style={{ color: "var(--text-secondary)" }}>
                {venue}
              </span>
              <span className="font-mono" style={{ color: amount > 0 ? "var(--text-primary)" : "var(--text-muted)" }}>
                ${amount.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

function ProportionalBar({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div style={{ marginTop: 18 }}>
      <div
        style={{
          display: "flex",
          width: "100%",
          height: 10,
          borderRadius: 6,
          overflow: "hidden",
          border: "1px solid var(--border)",
        }}
      >
        {segments.map((s) => (
          <div
            key={s.label}
            title={`${s.label}: $${s.value.toLocaleString()}`}
            style={{ width: `${(s.value / total) * 100}%`, background: s.color, transition: "width 0.4s ease" }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, gap: 8, flexWrap: "wrap" }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, display: "inline-block" }} />
            <span style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>{s.label}</span>
            <span className="font-mono" style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
              ${s.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Executions ────────────────────────────────────────────────── */
function ExecutionsPanel({
  executions,
  status,
  updatedAt,
}: {
  executions: Execution[];
  status: "loading" | "live" | "error";
  updatedAt: number;
}) {
  return (
    <Panel
      title="Recent executions"
      subtitle="Every row is an onchain receipt on Arc"
      status={status}
      updatedAt={updatedAt}
      source="arc receipts"
    >
      {executions.length === 0 ? (
        <EmptyState text="No executions yet — run a capture cycle." />
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {executions.map((e) => (
            <li
              key={e.id}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 110px 92px 70px",
                gap: 12,
                alignItems: "center",
                padding: "12px 20px",
                borderBottom: "1px solid var(--border)",
                fontSize: 12.5,
              }}
            >
              <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)" }}>
                {timeAgo(e.atMs)}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-primary)" }}>
                  {e.cycleString}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  {e.venueString} · {e.txHash}
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
                ${e.sizeUsdc.toLocaleString()}
              </span>
              <span style={{ fontFamily: "var(--font-geist-mono)", textAlign: "right", color: "var(--text-muted)" }}>
                {e.latencyMs}ms
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ── Venues ────────────────────────────────────────────────────── */
function VenuesPanel({
  venues,
  edgeCount,
  status,
  updatedAt,
}: {
  venues: Venue[];
  edgeCount: number;
  status: "loading" | "live" | "error";
  updatedAt: number;
}) {
  return (
    <Panel
      title="Monitored venues"
      subtitle={`${venues.length} nodes · ${edgeCount} edges in the live graph`}
      status={status}
      updatedAt={updatedAt}
      source="venue feeds"
    >
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {venues.map((v) => (
          <li
            key={v.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto",
              gap: 10,
              alignItems: "center",
              padding: "12px 20px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div>
              <div style={{ color: "var(--text-primary)", fontWeight: 500, fontSize: 13 }}>{v.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, fontFamily: "var(--font-geist-mono)" }}>
                {v.chain.toLowerCase()}
              </div>
            </div>
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
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span className="dot dot-green" style={{ animation: "pulse 1.6s ease-in-out infinite" }} />
              <span style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>active</span>
            </span>
          </li>
        ))}
      </ul>
      <div style={{ padding: "14px 20px", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.04em" }}>
        Each venue = one Circle Wallet on its chain.
      </div>
    </Panel>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ padding: "44px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>{text}</div>
  );
}
