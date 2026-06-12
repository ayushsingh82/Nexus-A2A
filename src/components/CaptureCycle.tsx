"use client";

import { useEffect, useRef, useState } from "react";

type SwarmResult = {
  ok: boolean;
  yieldCollectedUsdc: number;
  rebalanced: boolean;
  rebalanceDetails?: string;
};

const STEPS = [
  { title: "Check Smart Account",   detail: "Verify ERC-7715 permission from MetaMask Flask wallet" },
  { title: "Fetch live APY rates",  detail: "DeFiLlama · Aave v3 · Uniswap V3 · Hyperliquid funding" },
  { title: "Master agent decides",  detail: "Compare APYs — pick rebalance target if spread > 100 bps" },
  { title: "Redelegate via ERC-7710", detail: "Master issues subdelegations to sub-agents with new caps" },
  { title: "Aave Agent deploys",    detail: "Deposit USDC on Aave v3 within delegated cap" },
  { title: "Uniswap LP deploys",    detail: "Provide USDC/ETH liquidity within delegated cap" },
  { title: "Perp Agent deploys",    detail: "Capture BTC funding rate within delegated cap" },
  { title: "Collect yield",         detail: "Agents pull earned interest + LP fees + funding" },
  { title: "1Shot relays gas",      detail: "All transactions settled — gas paid in USDC, no ETH needed" },
];

const STEP_MS = 580;

export default function CaptureCycle({ onScanned }: { onScanned: () => void }) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [result, setResult] = useState<SwarmResult | null>(null);
  const scanDone = useRef(false);

  function start() {
    setOpen(true);
    setRunning(true);
    setStep(0);
    setResult(null);
    scanDone.current = false;

    fetch("/api/scan", { method: "POST" })
      .then((r) => r.json())
      .then((data: SwarmResult) => {
        setResult(data);
        scanDone.current = true;
        onScanned();
      })
      .catch(() => { scanDone.current = true; });
  }

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
        ▶ Run swarm cycle
      </button>

      {open && (
        <div className="argo-overlay" onClick={() => { if (!running) setOpen(false); }}>
          <div className="argo-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div className="section-title">Swarm cycle</div>
              <button
                onClick={() => !running && setOpen(false)}
                disabled={running}
                aria-label="close"
                style={{ border: "none", background: "transparent", fontSize: 18, cursor: running ? "not-allowed" : "pointer", color: "var(--text-muted)", opacity: running ? 0.4 : 1 }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
              Live delegation cycle — real APY data, real agent decisions.
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
                {result?.yieldCollectedUsdc ? (
                  <>
                    <span className="dot dot-green" />
                    Yield collected:{" "}
                    <strong style={{ color: "var(--teal-text)" }}>
                      +${result.yieldCollectedUsdc.toFixed(2)} USDC
                    </strong>
                    {result.rebalanced && result.rebalanceDetails && (
                      <> · rebalanced <strong>{result.rebalanceDetails}</strong></>
                    )}
                  </>
                ) : result ? (
                  <>
                    <span className="dot dot-amber" />
                    Swarm ran — yield rates updated. No rebalance this tick.
                  </>
                ) : (
                  <>
                    <span className="dot dot-red" />
                    Scan failed — kept last-known agent state.
                  </>
                )}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              {done && (
                <>
                  <button className="btn-neutral-outline" onClick={() => setOpen(false)}>Close</button>
                  <button className="btn-primary" onClick={start} style={{ padding: "8px 16px" }}>Run again</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
