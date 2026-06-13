"use client";

import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { baseSepolia, BASE_SEPOLIA_USDC } from "@/lib/wagmi";

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function SidebarWallet() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const { data: usdcBalance } = useBalance({
    address,
    token: BASE_SEPOLIA_USDC,
    chainId: baseSepolia.id,
    query: { enabled: isConnected && !!address },
  });

  const wrongNetwork = isConnected && chain?.id !== baseSepolia.id;

  if (!isConnected) {
    return (
      <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
          Wallet · Base Sepolia
        </div>
        <button
          onClick={() => {
            const mm = connectors.find((c) => c.id === "metaMask" || c.id === "injected");
            connect({ connector: mm ?? connectors[0], chainId: baseSepolia.id });
          }}
          disabled={isPending}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "9px 12px",
            background: "#0001FC",
            color: "#fff",
            fontSize: 12.5,
            fontWeight: 700,
            border: "none",
            cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.7 : 1,
            fontFamily: "inherit",
            letterSpacing: "-0.01em",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
          </svg>
          {isPending ? "Connecting…" : "Connect MetaMask"}
        </button>
        <p style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 7, lineHeight: 1.4 }}>
          Connect to grant ERC-7715 permissions on Base Sepolia
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
        Wallet · Base Sepolia
      </div>
      <div style={{
        padding: "10px 12px",
        background: wrongNetwork ? "rgba(220,38,38,0.06)" : "rgba(0,1,252,0.05)",
        border: `1px solid ${wrongNetwork ? "rgba(220,38,38,0.2)" : "rgba(0,1,252,0.15)"}`,
        marginBottom: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: wrongNetwork ? "#dc2626" : "#16a34a", display: "inline-block" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: wrongNetwork ? "#dc2626" : "#16a34a" }}>
            {wrongNetwork ? "Wrong Network" : "Base Sepolia"}
          </span>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-primary)", fontWeight: 600 }}>
          {shortAddr(address!)}
        </div>
        {!wrongNetwork && (
          <div style={{ marginTop: 6, padding: "4px 8px", background: "rgba(0,1,252,0.08)", display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#0001FC" }}>USDC</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "#0001FC" }}>
              {usdcBalance ? parseFloat(usdcBalance.formatted).toFixed(4) : "—"}
            </span>
          </div>
        )}
      </div>
      <button
        onClick={() => disconnect()}
        style={{
          display: "block",
          width: "100%",
          padding: "7px 0",
          textAlign: "center",
          background: "none",
          border: "1px solid var(--border)",
          cursor: "pointer",
          fontSize: 11.5,
          color: "var(--text-muted)",
          fontWeight: 600,
          fontFamily: "inherit",
          letterSpacing: "0.02em",
        }}
      >
        Disconnect
      </button>
    </div>
  );
}
