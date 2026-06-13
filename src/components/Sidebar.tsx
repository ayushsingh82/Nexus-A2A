"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import NexusLogo from "@/components/NexusLogo";

const SidebarWallet = dynamic(() => import("@/components/SidebarWallet"), { ssr: false });

const NAV = [
  { href: "/dashboard",             icon: "▦", label: "Dashboard" },
  { href: "/dashboard/command",     icon: "⌘", label: "Command",       badge: "NEW" },
  { href: "/dashboard/agents",      icon: "◈", label: "Agent Registry" },
  { href: "/dashboard/delegations", icon: "⟲", label: "Delegation Tree" },
  { href: "/dashboard/executions",  icon: "▶", label: "Executions" },
  { href: "/dashboard/portfolio",   icon: "≋", label: "Portfolio" },
  { href: "/dashboard/ask",         icon: "✦", label: "Ask the swarm" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar" style={{ display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto" }}>
      <Link href="/" className="sidebar-logo" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, padding: "16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <NexusLogo size={26} />
        <div>
          <div className="font-brand" style={{ fontSize: 18, color: "var(--text-primary)", lineHeight: 1, letterSpacing: "-0.03em" }}>
            Nexus-A2A
          </div>
          <div style={{ fontSize: 9.5, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 3, fontWeight: 600 }}>
            agent swarm
          </div>
        </div>
      </Link>

      <nav className="sidebar-nav" style={{ flex: 1 }}>
        <div className="nav-section-label">Navigation</div>
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href)) ||
            (item.href === "/dashboard" && pathname === "/dashboard");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${active ? " active" : ""}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 16px",
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                color: active ? "var(--teal-text)" : "var(--text-secondary)",
                background: active ? "rgba(0,1,252,0.06)" : "transparent",
                borderLeft: active ? "2px solid #0001FC" : "2px solid transparent",
                textDecoration: "none",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 12, width: 16, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {"badge" in item && item.badge && (
                <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: "0.08em", padding: "2px 5px", background: "rgba(0,1,252,0.12)", color: "#0001FC", flexShrink: 0 }}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <SidebarWallet />

      <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.03em", flexShrink: 0 }}>
        ERC-7710 · ERC-7715 · 1Shot · Base Sepolia
      </div>
    </aside>
  );
}
