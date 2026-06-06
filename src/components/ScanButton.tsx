"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Summary = {
  cyclesAboveThreshold: number;
  executed?: { realizedUsdc: number; netBps: number };
};

export default function ScanButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [last, setLast] = useState<Summary | null>(null);

  async function runScan() {
    const res = await fetch("/api/scan", { method: "POST" });
    if (!res.ok) {
      console.error("scan failed", await res.text());
      return;
    }
    const data = (await res.json()) as {
      cyclesAboveThreshold: number;
      executed?: { realizedUsdc: number; netBps: number };
    };
    setLast({
      cyclesAboveThreshold: data.cyclesAboveThreshold,
      executed: data.executed,
    });
    startTransition(() => router.refresh());
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
      <button
        onClick={runScan}
        disabled={isPending}
        className="btn-primary"
        style={{ padding: "9px 16px", fontSize: 13 }}
      >
        {isPending ? "scanning…" : "Run scan →"}
      </button>
      {last && (
        <span
          style={{
            fontSize: 12,
            color: "var(--text-secondary)",
            fontFamily: "var(--font-geist-mono)",
          }}
        >
          {last.cyclesAboveThreshold} cycles above threshold
          {last.executed
            ? ` · captured ${last.executed.netBps > 0 ? "+" : ""}${last.executed.netBps.toFixed(1)} bps · ${last.executed.realizedUsdc >= 0 ? "+" : ""}$${last.executed.realizedUsdc.toFixed(2)}`
            : " · no execution"}
        </span>
      )}
    </div>
  );
}
