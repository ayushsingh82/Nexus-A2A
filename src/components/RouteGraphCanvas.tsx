"use client";

import type { Cycle, PriceEdge, Token } from "@/graph/types";

/**
 * Live, animated view of the price graph. Tokens sit on a ring; every tradable
 * edge is a faint chord. The current best negative cycle is drawn in brand
 * green with a flowing dash, and a USDC "packet" travels the loop to show the
 * round-trip that nets the spread. Pure SVG — no graph library.
 */
export default function RouteGraphCanvas({
  edges,
  cycle,
}: {
  edges: PriceEdge[];
  cycle?: Cycle;
}) {
  const tokens = uniqueTokens(edges, cycle);

  if (tokens.length === 0) {
    return (
      <div
        style={{
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontSize: 13,
          textAlign: "center",
          padding: 20,
        }}
      >
        Run a capture cycle to build the live graph from real venue prices.
      </div>
    );
  }

  const W = 460;
  const H = 300;
  const cx = W / 2;
  const cy = H / 2 + 6;
  const R = tokens.length <= 2 ? 70 : 110;

  const pos = new Map<Token, { x: number; y: number }>();
  tokens.forEach((t, i) => {
    const a = (-90 + (i * 360) / tokens.length) * (Math.PI / 180);
    pos.set(t, { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
  });

  // unique unordered token pairs that have at least one edge
  const pairSet = new Set<string>();
  for (const e of edges) {
    const key = [e.from, e.to].sort().join("|");
    pairSet.add(key);
  }
  const chords = [...pairSet]
    .map((k) => k.split("|") as [Token, Token])
    .filter(([a, b]) => pos.has(a) && pos.has(b));

  // cycle geometry
  const cyclePts = cycle?.nodes.map((n) => pos.get(n)).filter(Boolean) as
    | { x: number; y: number }[]
    | undefined;
  const cyclePath =
    cyclePts && cyclePts.length >= 2
      ? cyclePts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")
      : "";

  const cycleTokenSet = new Set<Token>(cycle?.nodes ?? []);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto", display: "block" }}
      role="img"
      aria-label="Live route graph"
    >
      {/* faint chords for every tradable pair */}
      {chords.map(([a, b], i) => {
        const pa = pos.get(a)!;
        const pb = pos.get(b)!;
        return (
          <line
            key={`c-${i}`}
            x1={pa.x}
            y1={pa.y}
            x2={pb.x}
            y2={pb.y}
            stroke="var(--border-strong)"
            strokeWidth="1"
          />
        );
      })}

      {/* highlighted cycle */}
      {cyclePath && (
        <>
          <path
            d={cyclePath}
            fill="none"
            stroke="var(--brand-green)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray="6 7"
            className="argo-flow"
            opacity="0.95"
          />
          {/* USDC packet traveling the loop */}
          <g>
            <animateMotion path={cyclePath} dur="2.8s" repeatCount="indefinite" />
            <circle r="9" fill="var(--brand-green)" />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fontSize="9"
              fontWeight="700"
              fill="#ecfdf5"
              fontFamily="var(--font-geist-mono)"
            >
              $
            </text>
          </g>
        </>
      )}

      {/* nodes */}
      {tokens.map((t) => {
        const p = pos.get(t)!;
        const inCycle = cycleTokenSet.has(t);
        const isUsdc = t === "USDC";
        return (
          <g key={t}>
            <circle
              cx={p.x}
              cy={p.y}
              r="22"
              fill={isUsdc ? "rgba(1,183,62,0.12)" : "var(--bg-surface)"}
              stroke={inCycle || isUsdc ? "var(--brand-green)" : "var(--border-strong)"}
              strokeWidth={inCycle || isUsdc ? "2" : "1"}
            />
            <text
              x={p.x}
              y={p.y + 4}
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              fill={isUsdc ? "var(--teal-text)" : "var(--text-primary)"}
              fontFamily="var(--font-geist-mono)"
            >
              {t}
            </text>
          </g>
        );
      })}

      {/* net bps badge in the middle */}
      {cycle && (
        <g>
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            fontSize="20"
            fontWeight="700"
            fill="var(--teal-text)"
            fontFamily="var(--font-geist-mono)"
          >
            +{cycle.netBps.toFixed(1)} bps
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            fontSize="10"
            fill="var(--text-muted)"
            fontFamily="var(--font-geist-mono)"
            letterSpacing="0.06em"
          >
            best cycle · net of fees
          </text>
        </g>
      )}
    </svg>
  );
}

function uniqueTokens(edges: PriceEdge[], cycle?: Cycle): Token[] {
  const set = new Set<Token>();
  for (const e of edges) {
    set.add(e.from);
    set.add(e.to);
  }
  for (const n of cycle?.nodes ?? []) set.add(n);
  // USDC first so it anchors the top of the ring
  const all = [...set];
  all.sort((a, b) => (a === "USDC" ? -1 : b === "USDC" ? 1 : a.localeCompare(b)));
  return all;
}
