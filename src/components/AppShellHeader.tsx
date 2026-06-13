"use client";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const WalletButton = dynamic(() => import("@/components/WalletButton"), { ssr: false });

const TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Agent swarm overview — live yield across all delegated protocols.",
  },
  "/dashboard/command": {
    title: "Command",
    subtitle: "Type a prompt — the swarm parses your intent and executes it on-chain.",
  },
  "/dashboard/ask": {
    title: "Ask the swarm",
    subtitle: "Open-ended Q&A — answered live from the swarm's real state.",
  },
  "/dashboard/agents": {
    title: "Agent Registry",
    subtitle: "Live status for every agent in the swarm.",
  },
  "/dashboard/delegations": {
    title: "Delegation Tree",
    subtitle: "ERC-7710 subdelegation graph — orchestrator to sub-agents.",
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
    subtitle: "Every on-chain action with 1Shot relayer receipt.",
  },
  "/dashboard/treasury": {
    title: "Treasury",
    subtitle: "Per-venue wallets, unified balance, idle USDC.",
  },
  "/dashboard/wallets": {
    title: "Wallets",
    subtitle: "Provisioned wallets — fund via Base Sepolia faucet.",
  },
  "/dashboard/network": {
    title: "Network",
    subtitle: "Base Sepolia — chain ID, RPCs, contract addresses, faucet.",
  },
  "/dashboard/portfolio": {
    title: "Portfolio",
    subtitle: "Total USDC deployed with per-agent breakdown.",
  },
};

export default function AppShellHeader() {
  const pathname = usePathname();
  const meta = TITLES[pathname] ?? { title: "Nexus-A2A" };

  return (
    <div className="topbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: "var(--topbar-h)", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
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
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className="live-pill">
          <span className="live-pill__dot" />
          swarm · base sepolia
        </span>
        <WalletButton />
      </div>
    </div>
  );
}
