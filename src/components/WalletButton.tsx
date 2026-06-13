"use client";

import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { baseSepolia, BASE_SEPOLIA_USDC } from "@/lib/wagmi";
import { useState } from "react";

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function WalletButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);

  const { data: usdcBalance } = useBalance({
    address,
    token: BASE_SEPOLIA_USDC,
    chainId: baseSepolia.id,
    query: { enabled: isConnected && !!address },
  });

  if (!isConnected) {
    return (
      <button
        onClick={() => {
          const mm = connectors.find((c) => c.id === "metaMask" || c.id === "injected");
          connect({ connector: mm ?? connectors[0], chainId: baseSepolia.id });
        }}
        disabled={isPending}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 14px",
          background: "#0001FC",
          color: "#fff",
          fontSize: 12.5,
          fontWeight: 700,
          border: "none",
          cursor: isPending ? "not-allowed" : "pointer",
          letterSpacing: "-0.01em",
          opacity: isPending ? 0.7 : 1,
          fontFamily: "inherit",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </svg>
        {isPending ? "Connecting…" : "Connect Wallet"}
      </button>
    );
  }

  const wrongNetwork = chain?.id !== baseSepolia.id;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 14px",
          background: wrongNetwork ? "rgba(220,38,38,0.08)" : "rgba(0,1,252,0.08)",
          color: wrongNetwork ? "#dc2626" : "#0001FC",
          fontSize: 12.5,
          fontWeight: 700,
          border: `1px solid ${wrongNetwork ? "rgba(220,38,38,0.25)" : "rgba(0,1,252,0.22)"}`,
          cursor: "pointer",
          letterSpacing: "-0.01em",
          fontFamily: "inherit",
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: wrongNetwork ? "#dc2626" : "#16a34a", display: "inline-block" }} />
        {wrongNetwork ? "Wrong Network" : shortAddr(address!)}
        {usdcBalance && !wrongNetwork && (
          <span style={{ marginLeft: 4, padding: "1px 7px", background: "rgba(0,1,252,0.1)", fontSize: 11, fontWeight: 700 }}>
            {parseFloat(usdcBalance.formatted).toFixed(2)} USDC
          </span>
        )}
        <span style={{ fontSize: 9 }}>▾</span>
      </button>

      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 39 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 40,
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.12)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
            minWidth: 220,
            padding: "12px 0",
          }}>
            <div style={{ padding: "6px 16px 10px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#8a8d99", marginBottom: 4 }}>Connected</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#000", fontFamily: "var(--font-mono)" }}>{shortAddr(address!)}</div>
              <div style={{ fontSize: 11, color: "#8a8d99", marginTop: 2 }}>
                {wrongNetwork ? (
                  <span style={{ color: "#dc2626" }}>Switch to Base Sepolia</span>
                ) : (
                  <>Base Sepolia · {usdcBalance ? `${parseFloat(usdcBalance.formatted).toFixed(4)} USDC` : "Loading…"}</>
                )}
              </div>
            </div>
            <button
              onClick={() => { disconnect(); setOpen(false); }}
              style={{ display: "block", width: "100%", padding: "9px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#dc2626", fontWeight: 600, fontFamily: "inherit" }}
            >
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}
