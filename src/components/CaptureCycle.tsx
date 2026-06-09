"use client";

import { useEffect, useRef, useState } from "react";

type ScanResult = {
  ok: boolean;
  cyclesAboveThreshold: number;
  edgeCount: number;
  executed?: { realizedUsdc: number; netBps: number };
  venuesOk?: { hyperliquid: boolean; binance: boolean; chainlink: boolean };
};

/** The full Argo pipeline, step by step — the loop the agent runs every tick. */
const STEPS = [
  { title: "Scan venues", detail: "Polling Hyperliquid · Binance · Chainlink mids" },
  { title: "Build price graph", detail: "Directed edges weighted by −log(rate · (1 − fee))" },
  { title: "Detect negative cycle", detail: "Bellman-Ford finds profitable closed loops" },
  { title: "Size with Kelly", detail: "Capped by the per-edge liquidity floor" },
  { title: "Route via Circle Gateway", detail: "Unified USDC — no pre-funding each venue" },
  { title: "Bridge with CCTP", detail: "Burn-and-mint USDC across chains" },
  { title: "Execute legs", detail: "Fill each hop across the venues in the loop" },
  { title: "Settle on Arc", detail: "Receipt onchain · ~$0.01 fee · sub-second finality" },
  { title: "Park idle in USYC", detail: "Idle capital earns yield between captures" },
];

const STEP_MS = 620;

export default function CaptureCycle({ onScanned }: { onScanned: () => void }) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [result, setResult] = useState<ScanResult | null>(null);
  const scanDone = useRef(false);

  function start() {
    setOpen(true);
    setRunning(true);
    setStep(0);
    setResult(null);
    scanDone.current = false;

    // fire the real scan in parallel with the animation
    fetch("/api/scan", { method: "POST" })
      .then((r) => r.json())
      .then((data: ScanResult) => {
        setResult(data);
        scanDone.current = true;
        onScanned();
      })
      .catch(() => {
        scanDone.current = true;
      });
  }

  // advance the stepper
  useEffect(() => {
    if (!running) return;
    if (step >= STEPS.length - 1) {
      const t = setTimeout(() => setRunning(false), STEP_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [running, step]);

  const done = open && !running && step >= STEPS.length - 1;

  return (
    <>
      <button onClick={start} className="btn-primary" style={{ padding: "9px 16px", fontSize: 13 }}>
        ▶ Run capture cycle
      </button>

      {open && (
        <div
          className="argo-overlay"
          onClick={() => {
            if (!running) setOpen(false);
          }}
        >
          <div className="argo-modal" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <div className="section-title">Capture cycle</div>
              <button
                onClick={() => !running && setOpen(false)}
                disabled={running}
                aria-label="close"
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 18,
                  cursor: running ? "not-allowed" : "pointer",
                  color: "var(--text-muted)",
                  opacity: running ? 0.4 : 1,
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
              Live scan on real venue prices, end to end.
            </div>

            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
              {STEPS.map((s, i) => {
                const state = i < step ? "done" : i === step ? "active" : "todo";
                return (
                  <li key={s.title} className={`argo-step argo-step--${state}`}>
                    <span className="argo-step__mark">
                      {state === "done" ? "✓" : state === "active" ? "" : i + 1}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span className="argo-step__title">{s.title}</span>
                      <span className="argo-step__detail">{s.detail}</span>
                    </span>
                  </li>
                );
              })}
            </ol>

            {done && (
              <div className="argo-result">
                {result?.executed ? (
                  <>
                    <span className="dot dot-green" />
                    Captured{" "}
                    <strong style={{ color: "var(--teal-text)" }}>
                      {result.executed.netBps > 0 ? "+" : ""}
                      {result.executed.netBps.toFixed(1)} bps
                    </strong>{" "}
                    ·{" "}
                    <strong style={{ color: "var(--green)" }}>
                      {result.executed.realizedUsdc >= 0 ? "+" : ""}$
                      {result.executed.realizedUsdc.toFixed(2)}
                    </strong>{" "}
                    settled on Arc.
                  </>
                ) : result ? (
                  <>
                    <span className="dot dot-amber" />
                    No cycle above the 5 bps threshold this tick — graph rebuilt from{" "}
                    {result.edgeCount} live edges.
                  </>
                ) : (
                  <>
                    <span className="dot dot-red" />
                    Scan failed — kept last-known edges.
                  </>
                )}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              {done && (
                <>
                  <button className="btn-neutral-outline" onClick={() => setOpen(false)}>
                    Close
                  </button>
                  <button className="btn-primary" onClick={start} style={{ padding: "8px 16px" }}>
                    Run again
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
