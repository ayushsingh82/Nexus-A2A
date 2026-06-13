"use client";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const WalletButton = dynamic(() => import("@/components/WalletButton"), { ssr: false });

const TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/dashboard":              { title: "Dashboard",       subtitle: "Agent swarm overview — live yield across all delegated protocols." },
  "/dashboard/command":      { title: "Command",         subtitle: "Type a prompt — the swarm parses your intent and executes it on-chain." },
  "/dashboard/ask":          { title: "Ask the swarm",   subtitle: "Open-ended Q&A — answered live from the swarm's real state." },
  "/dashboard/agents":       { title: "Agent Registry",  subtitle: "Live status for every agent in the swarm." },
  "/dashboard/delegations":  { title: "Delegation Tree", subtitle: "ERC-7710 subdelegation graph — orchestrator to sub-agents." },
  "/dashboard/venues":       { title: "Venues",          subtitle: "Real-time mids from every monitored venue + their edges." },
  "/dashboard/graph":        { title: "Route Graph",     subtitle: "Live directed graph of tradable edges and negative cycles." },
  "/dashboard/executions":   { title: "Executions",      subtitle: "Every on-chain action with 1Shot relayer receipt." },
  "/dashboard/treasury":     { title: "Treasury",        subtitle: "Per-venue wallets, unified balance, idle USDC." },
  "/dashboard/wallets":      { title: "Wallets",         subtitle: "Provisioned wallets — fund via Base Sepolia faucet." },
  "/dashboard/network":      { title: "Network",         subtitle: "Base Sepolia — chain ID, RPCs, contract addresses, faucet." },
  "/dashboard/portfolio":    { title: "Portfolio",       subtitle: "Total USDC deployed with per-agent breakdown." },
  "/dashboard/risk":         { title: "Risk Engine",     subtitle: "Real-time risk monitoring across all agent positions." },
  "/dashboard/strategy":     { title: "Strategy Lab",    subtitle: "Design and test yield strategies before deployment." },
};

function MiniFlow() {
  const W = 130;
  const H = 44;
  const cx = 16;
  const cy = H / 2;
  const agents = [
    { x: W - 16, y: 8,       color: "#B6509E" },
    { x: W - 16, y: H / 2,   color: "#FF007A" },
    { x: W - 16, y: H - 8,   color: "#0891b2" },
  ];

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" style={{ display: "block" }}>
      <style>{`
        @keyframes nx-flow {
          0%   { stroke-dashoffset: 24; opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
      `}</style>

      {/* Orchestrator node */}
      <circle cx={cx} cy={cy} r={9} fill="#0001FC" />
      <text x={cx} y={cy + 0.5} textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="700" fill="#fff" fontFamily="system-ui">N</text>

      {/* Edges + particles */}
      {agents.map((a, i) => {
        const qx = (cx + a.x) / 2;
        const qy = a.y;
        const pathId = `nx-p${i}`;
        const delay = i * 0.45;
        return (
          <g key={i}>
            <path
              d={`M ${cx} ${cy} Q ${qx} ${qy} ${a.x} ${a.y}`}
              stroke={a.color}
              strokeWidth="1"
              strokeOpacity="0.3"
              fill="none"
            />
            <path
              id={pathId}
              d={`M ${cx} ${cy} Q ${qx} ${qy} ${a.x} ${a.y}`}
              stroke={a.color}
              strokeWidth="2"
              strokeDasharray="4 20"
              strokeDashoffset="24"
              strokeLinecap="round"
              fill="none"
              style={{ animation: `nx-flow 1.8s ${delay}s ease-in-out infinite` }}
            />
            <circle cx={a.x} cy={a.y} r={5} fill={a.color} opacity="0.85" />
          </g>
        );
      })}
    </svg>
  );
}

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
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <MiniFlow />
        <span className="live-pill">
          <span className="live-pill__dot" />
          swarm · base sepolia
        </span>
        <WalletButton />
      </div>
    </div>
  );
}
