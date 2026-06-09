"use client";

import { useEffect, useState } from "react";
import type { LiveStatus } from "@/lib/useLiveData";
import { timeAgo } from "@/lib/useLiveData";

/**
 * Per-panel freshness indicator: pulsing dot + source + "updated Ns ago".
 * Ticks once a second so the relative time stays honest.
 */
export default function StatusDot({
  status,
  updatedAt,
  source,
}: {
  status: LiveStatus;
  updatedAt: number;
  source?: string;
}) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const cfg: Record<LiveStatus, { cls: string; label: string }> = {
    live: { cls: "dot-green", label: "live" },
    loading: { cls: "dot-muted", label: "loading" },
    error: { cls: "dot-red", label: "stale" },
  };
  const c = cfg[status];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontSize: 11,
        color: "var(--text-muted)",
        fontFamily: "var(--font-geist-mono)",
        whiteSpace: "nowrap",
      }}
    >
      <span
        className={`dot ${c.cls}`}
        style={status === "live" ? { animation: "pulse 1.6s ease-in-out infinite" } : undefined}
      />
      {source ? `${source} · ` : ""}
      {status === "live" ? timeAgo(updatedAt) : c.label}
    </span>
  );
}
