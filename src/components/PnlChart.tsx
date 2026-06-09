"use client";

import type { Execution } from "@/graph/types";

/**
 * Cumulative realized-PnL curve, drawn as a bespoke SVG area chart (no chart
 * library). `executions` arrives newest-first from the store, so we reverse it
 * to walk oldest → newest and accumulate realized USDC.
 */
export default function PnlChart({
  executions,
  height = 132,
}: {
  executions: Execution[];
  height?: number;
}) {
  const ordered = [...executions].reverse();
  let cum = 0;
  const points = ordered.map((e) => {
    cum = Math.round((cum + e.realizedUsdc) * 100) / 100;
    return cum;
  });

  if (points.length < 2) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontSize: 12.5,
        }}
      >
        Run a few cycles to plot the realized-PnL curve.
      </div>
    );
  }

  const W = 600;
  const H = height;
  const pad = 6;
  const min = Math.min(0, ...points);
  const max = Math.max(...points);
  const span = max - min || 1;

  const x = (i: number) => pad + (i / (points.length - 1)) * (W - pad * 2);
  const y = (v: number) => H - pad - ((v - min) / span) * (H - pad * 2);

  const line = points.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L ${x(points.length - 1).toFixed(1)} ${H - pad} L ${x(0).toFixed(1)} ${H - pad} Z`;
  const zeroY = y(0);
  const last = points[points.length - 1];
  const positive = last >= 0;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height, display: "block" }}
      role="img"
      aria-label="Cumulative realized PnL"
    >
      <defs>
        <linearGradient id="argo-pnl-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-green)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--brand-green)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* zero baseline */}
      <line
        x1={pad}
        x2={W - pad}
        y1={zeroY}
        y2={zeroY}
        stroke="var(--border-strong)"
        strokeWidth="1"
        strokeDasharray="3 4"
      />

      <path d={area} fill="url(#argo-pnl-fill)" />
      <path
        d={line}
        fill="none"
        stroke={positive ? "var(--brand-green)" : "var(--red)"}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* leading marker */}
      <circle
        cx={x(points.length - 1)}
        cy={y(last)}
        r="3.5"
        fill={positive ? "var(--brand-green)" : "var(--red)"}
      />
    </svg>
  );
}
