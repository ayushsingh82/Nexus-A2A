"use client";
import { usePathname } from "next/navigation";

const TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Live arbitrage signal across spot venues on Arc.",
  },
  "/dashboard/ask": {
    title: "Ask the swarm",
    subtitle: "Open-ended Q&A — answered live from the swarm's real state.",
  },
  "/dashboard/venues": {
    title: "Venues",
    subtitle: "Real-time mids from every monitored venue + their edges.",
  },
  "/dashboard/graph": {
    title: "Route Graph",
    subtitle: "Live directed graph of tradable edges and negative cycles.",
  },
  "/dashboard/executions": {
    title: "Executions",
    subtitle: "Every captured arb with onchain receipt.",
  },
  "/dashboard/treasury": {
    title: "Treasury",
    subtitle: "Per-venue Circle Wallets, unified balance, USYC parking.",
  },
  "/dashboard/wallets": {
    title: "Circle Wallets",
    subtitle: "Provisioned wallets on Arc Testnet, fund via faucet.circle.com.",
  },
  "/dashboard/network": {
    title: "Arc Network",
    subtitle: "Arc Testnet — chain ID, RPCs, contract addresses, faucet.",
  },
};

export default function AppShellHeader() {
  const pathname = usePathname();
  const meta = TITLES[pathname] ?? { title: "Argo" };

  return (
    <div className="topbar">
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
          {meta.title}
        </div>
        {meta.subtitle && (
          <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 1 }}>
            {meta.subtitle}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="live-pill">
          <span className="live-pill__dot" />
          scanning · arc testnet
        </span>
      </div>
    </div>
  );
}
