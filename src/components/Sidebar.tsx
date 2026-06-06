"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ArgoLogo from "./ArgoLogo";

const NAV = [
  { href: "/dashboard", icon: "▦", label: "Dashboard" },
  { href: "/dashboard/markets", icon: "≋", label: "Markets" },
  { href: "/dashboard/routes", icon: "⟲", label: "Route Graph" },
  { href: "/dashboard/executions", icon: "▶", label: "Executions" },
  { href: "/dashboard/treasury", icon: "◈", label: "Treasury" },
  { href: "/dashboard/settings", icon: "⚙", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo">
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(145deg, #01b73e 0%, #019a35 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 2px 6px rgba(1, 183, 62, 0.22)",
            }}
          >
            <ArgoLogo size={20} variant="on-brand" />
          </div>
          <div>
            <div
              className="font-brand"
              style={{
                fontSize: 24,
                color: "var(--text-primary)",
                lineHeight: 1,
              }}
            >
              Argo
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginTop: 2,
              }}
            >
              arb agent · arc
            </div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
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
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          padding: "14px 18px",
          borderTop: "1px solid var(--border)",
          fontSize: 11,
          color: "var(--text-muted)",
          letterSpacing: "0.04em",
        }}
      >
        Settled on Arc · USDC
      </div>
    </aside>
  );
}
