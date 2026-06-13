"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard",              icon: "▦", label: "Dashboard" },
  { href: "/dashboard/agents",       icon: "◈", label: "Agent Registry" },
  { href: "/dashboard/delegations",  icon: "⟲", label: "Delegation Tree" },
  { href: "/dashboard/executions",   icon: "▶", label: "Executions" },
  { href: "/dashboard/portfolio",    icon: "≋", label: "Portfolio" },
  { href: "/dashboard/ask",          icon: "✦", label: "Ask the swarm" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar">
      <Link href="/" className="sidebar-logo" style={{ textDecoration: "none", display: "block" }}>
        <div className="font-brand" style={{ fontSize: 20, color: "var(--text-primary)", lineHeight: 1, letterSpacing: "-0.03em" }}>
          Nexus-A2A
        </div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 5, fontWeight: 600 }}>
          yield swarm
        </div>
      </Link>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href)) ||
            (item.href === "/dashboard" && pathname === "/dashboard");
          return (
            <Link key={item.href} href={item.href} className={`nav-item${active ? " active" : ""}`}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: "14px 18px", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.04em" }}>
        ERC-7710 · ERC-7715 · 1Shot
      </div>
    </aside>
  );
}
