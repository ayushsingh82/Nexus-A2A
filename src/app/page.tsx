import Link from "next/link";
import HeroBackground from "@/components/HeroBackground";
import HeaderBackground from "@/components/HeaderBackground";

export default function Home() {
  return (
    <div>
      <Nav />
      <Hero />
      <Ticker />
      <AgentLoop />
      <WhyMetaMask />
      <MetaMaskStack />
      <DashboardFeatures />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ── Nav ────────────────────────────────────────────────────── */
function Nav() {
  return (
    <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 30, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(8px)" }}>
      <div className="landing-nav" style={{ maxWidth: 1180, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span className="font-brand" style={{ fontSize: 22, color: "#000", lineHeight: 1, letterSpacing: "-0.03em" }}>Nexus-A2A</span>
        </Link>
        <Link href="/dashboard" className="btn-brand-outline" style={{ fontSize: 13, padding: "8px 18px" }}>Open dashboard →</Link>
      </div>
    </header>
  );
}

/* ── Hero ───────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{ background: "#0001FC", minHeight: "92dvh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "calc(64px + 72px)", paddingBottom: 96, paddingLeft: 32, paddingRight: 32, position: "relative", overflow: "hidden" }}>
      {/* subtle depth overlay */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.07) 0%, transparent 60%)", pointerEvents: "none" }} />
      <div style={{ maxWidth: 900, width: "100%", position: "relative", zIndex: 1 }}>
        {/* eyebrow */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#fff", background: "#000", border: "1px solid #b0b3be", padding: "6px 14px", marginBottom: 28 }}>
          DeFi Yield Swarm · ERC-7710 · MetaMask Smart Accounts
        </div>
        {/* headline */}
        <h1 style={{ fontSize: "clamp(42px, 7vw, 76px)", fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.035em", color: "#fff", fontFamily: "var(--font-space), system-ui, sans-serif", margin: 0 }}>
          Four agents.<br />
          One delegation.<br />
          <span style={{ color: "rgba(255,255,255,0.65)" }}>Maximum yield.</span>
        </h1>
        {/* subtitle */}
        <p style={{ fontSize: "clamp(15px, 1.8vw, 17px)", color: "rgba(255,255,255,0.6)", lineHeight: 1.65, maxWidth: 620, marginTop: 28, letterSpacing: "-0.005em" }}>
          Nexus-A2A lets a master orchestrator agent receive a single ERC-7715 permission from your MetaMask wallet — then subdelegates via ERC-7710 to three specialized sub-agents that autonomously deploy your USDC across Aave, Uniswap, and Hyperliquid for best-in-class yield.
        </p>
        {/* CTAs */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 40 }}>
          <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 26px", background: "#fff", color: "#0001FC", fontSize: 14, fontWeight: 700, textDecoration: "none", letterSpacing: "-0.01em" }}>
            Open the live dashboard →
          </Link>
          <a href="#how" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 26px", background: "transparent", color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600, textDecoration: "none", letterSpacing: "-0.01em", border: "2px solid rgba(255,255,255,0.25)" }}>
            See how it works
          </a>
        </div>
        {/* stats bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0, marginTop: 72, borderTop: "2px solid #000" }}>
          {[
            { label: "Delegation type", value: "ERC-7710" },
            { label: "Permission", value: "ERC-7715" },
            { label: "Gas", value: "USDC · 1Shot" },
            { label: "Sub-agents", value: "3 protocols" },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: "22px 24px", background: "#fff", borderRight: i < 3 ? "1px solid #e0e0e0" : "none", borderBottom: "1px solid #e0e0e0" }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8a8d99", marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#000", letterSpacing: "-0.02em", fontFamily: "var(--font-space), system-ui, sans-serif" }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Ticker ─────────────────────────────────────────────────── */
function Ticker() {
  const items = [
    { tag: "YIELD",    text: "Aave Agent · 190k USDC · +5.24% APY · collecting interest", color: "green" },
    { tag: "REDELEGATE", text: "Master → Perp Agent · +12k USDC cap · ERC-7710 subdelegation", color: "blue" },
    { tag: "LP",       text: "Uniswap LP Agent · USDC/ETH · 142k deployed · +8.41% APY", color: "amber" },
    { tag: "YIELD",    text: "Perp Funding Agent · BTC funding · 138k USDC · +11.2% APY", color: "green" },
    { tag: "GAS",      text: "1Shot relayer · 3 txs settled · gas paid in USDC · no ETH needed", color: "blue" },
    { tag: "REBALANCE", text: "Master rebalanced 8k USDC → Perp Agent · spread +390 bps", color: "green" },
  ];
  return (
    <section style={{ background: "#111", borderTop: "1px solid #1f1f1f", padding: "14px 0", overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 32, whiteSpace: "nowrap", animation: "ticker 60s linear infinite", width: "max-content" }}>
        {[...items, ...items, ...items].map((it, i) => (
          <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", padding: "2px 8px", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const }}>{it.tag}</span>
            <span style={{ color: "rgba(255,255,255,0.75)" }} className="font-mono">{it.text}</span>
            <span style={{ color: "rgba(255,255,255,0.15)", marginLeft: 12 }}>·</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }`}</style>
    </section>
  );
}

/* ── Agent loop ─────────────────────────────────────────────── */
function AgentLoop() {
  const steps = [
    { n: "01", title: "Grant",       body: "User connects MetaMask Flask, upgrades to a Smart Account (EIP-7702), and grants ERC-7715 permission: spend up to 500k USDC/week for yield strategies." },
    { n: "02", title: "Redelegate",  body: "Master Orchestrator receives the permission and issues ERC-7710 subdelegations — Aave Agent gets 200k cap, Uniswap LP gets 150k, Perp Funding gets 150k." },
    { n: "03", title: "Deploy",      body: "Each sub-agent deploys USDC within its cap: Aave deposit, Uniswap V3 USDC/ETH LP position, and Hyperliquid perp funding-rate capture." },
    { n: "04", title: "Earn",        body: "Agents collect yield continuously — Aave interest, Uniswap LP fees, and Hyperliquid funding rate — all denominated in USDC." },
    { n: "05", title: "Rebalance",   body: "Master Agent compares live APY across protocols. If the spread exceeds 100 bps, it redelegates capital from the underperformer to the leader — fully on-chain." },
    { n: "06", title: "Report",      body: "Portfolio PnL, delegation tree, and agent status update in real time. Every action is an onchain receipt via 1Shot — gas paid in USDC, no ETH required." },
  ];
  return (
    <section id="how" className="landing-section" style={{ background: "var(--bg-base)", padding: "96px 28px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <SectionEyebrow>How it works</SectionEyebrow>
        <h2 style={{ fontSize: "clamp(32px, 4vw, 44px)", lineHeight: 1.08, letterSpacing: "-0.025em", maxWidth: 720, marginTop: 12 }}>
          One permission.{" "}
          <span className="underline-curve">Four agents, running in concert.</span>
        </h2>
        <p style={{ fontSize: 16, color: "var(--text-secondary)", marginTop: 16, maxWidth: 620, lineHeight: 1.55 }}>
          You sign once. The swarm handles the rest — deploying, earning, and rebalancing across protocols autonomously.
        </p>
        <div style={{ position: "relative", marginTop: 56, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, border: "1px solid var(--border)", borderRadius: 0, overflow: "hidden", background: "var(--bg-elevated)" }} className="agent-loop">
          {steps.map((s, i) => (
            <div key={s.n} style={{ position: "relative", padding: "28px 26px", borderRight: (i + 1) % 3 !== 0 ? "1px solid var(--border)" : "none", borderBottom: i < 3 ? "1px solid var(--border)" : "none", background: "var(--bg-elevated)", transition: "background 0.2s" }}>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 0, background: "rgba(0, 1, 252, 0.10)", color: "var(--teal-text)", fontFamily: "var(--font-geist-mono)", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em" }}>
                {s.n}
              </div>
              <div style={{ fontSize: 19, fontWeight: 700, marginTop: 14, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>{s.title}</div>
              <div style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.6 }}>{s.body}</div>
            </div>
          ))}
        </div>
        <style>{`
          @media (max-width: 900px) { .agent-loop { grid-template-columns: repeat(2, 1fr) !important; } .agent-loop > div { border-right: none !important; border-bottom: 1px solid var(--border) !important; } }
          @media (max-width: 600px) { .agent-loop { grid-template-columns: 1fr !important; } .agent-loop > div { border-right: none !important; } }
        `}</style>
      </div>
    </section>
  );
}

/* ── Why MetaMask ───────────────────────────────────────────── */
function WhyMetaMask() {
  const physics = [
    { stat: "ERC-7710",   label: "trustless redelegation", body: "Master agent subdelegates to sub-agents on-chain. Each sub-agent can only act within its caveats — revocable by you at any time." },
    { stat: "ERC-7715",   label: "scoped permission request", body: "You see exactly what you're granting: which token, what amount, for how long. No blank approvals, no exposed private keys." },
    { stat: "EIP-7702",   label: "EOA → Smart Account",   body: "Your existing MetaMask wallet upgrades to a Smart Account without migrating funds. Redelegation becomes possible instantly." },
  ];
  return (
    <section id="why" className="landing-section" style={{ background: "var(--bg-surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "96px 28px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <SectionEyebrow>Why MetaMask Smart Accounts are load-bearing</SectionEyebrow>
        <h2 style={{ fontSize: "clamp(28px, 3.5vw, 40px)", lineHeight: 1.1, letterSpacing: "-0.02em", maxWidth: 760, marginTop: 12 }}>
          Nexus-A2A cannot work without trustless on-chain redelegation.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginTop: 40 }}>
          {physics.map((p) => (
            <div key={p.label} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 0, padding: "26px 24px" }}>
              <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 32, fontWeight: 700, color: "var(--teal-text)", letterSpacing: "-0.02em" }}>{p.stat}</div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 6 }}>{p.label}</div>
              <div style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 14, lineHeight: 1.55 }}>{p.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── MetaMask stack ─────────────────────────────────────────── */
function MetaMaskStack() {
  const products = [
    { name: "Smart Accounts Kit", role: "EIP-7710 + ERC-7715 in one SDK. The foundation every agent runs on.", load: "critical" },
    { name: "EIP-7710",           role: "On-chain delegation — master → sub-agents. Caveats enforced at execution.", load: "critical" },
    { name: "ERC-7715",           role: "Fine-grained permission requests. User approves exact scope, not a blank check.", load: "critical" },
    { name: "EIP-7702",           role: "Upgrades your EOA to a Smart Account. No fund migration, instant smart-account features.", load: "core" },
    { name: "1Shot Relayer",      role: "Executes all ERC-7710 transactions. Gas paid in USDC — agents never need ETH.", load: "core" },
    { name: "Venice AI",          role: "On-chain AI for market intelligence. Master uses Venice to decide rebalance targets.", load: "unique" },
    { name: "x402 Protocol",      role: "Machine-to-machine payments. Sub-agents pay for Venice queries via x402 micropayments.", load: "unique" },
    { name: "MetaMask Flask",     role: "Required wallet. Supports ERC-7715 advanced permissions + EIP-7702 auto-upgrade.", load: "core" },
  ];
  const loadStyle: Record<string, React.CSSProperties> = {
    critical: { background: "rgba(0, 1, 252, 0.12)", color: "var(--teal-text)",       borderColor: "rgba(0, 1, 252, 0.32)" },
    unique:   { background: "rgba(37, 99, 235, 0.10)", color: "#1d4ed8",               borderColor: "rgba(37, 99, 235, 0.25)" },
    core:     { background: "rgba(0, 0, 0, 0.04)",     color: "var(--text-secondary)", borderColor: "var(--border-strong)" },
  };
  return (
    <section id="stack" className="landing-section" style={{ background: "var(--bg-base)", padding: "96px 28px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <SectionEyebrow>MetaMask stack</SectionEyebrow>
        <h2 style={{ fontSize: "clamp(32px, 4vw, 44px)", lineHeight: 1.08, letterSpacing: "-0.025em", maxWidth: 760, marginTop: 12 }}>
          Eight components.{" "}
          <span className="underline-curve">Every one load-bearing.</span>
        </h2>
        <p style={{ fontSize: 16, color: "var(--text-secondary)", marginTop: 16, maxWidth: 620, lineHeight: 1.55 }}>
          Remove any one of these and an agent loses either its permission, its execution path, or its intelligence.
        </p>
        <div style={{ marginTop: 44, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {products.map((p) => (
            <div key={p.name} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 0, padding: "20px 20px 22px", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{p.name}</div>
                <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 0, border: "1px solid", ...loadStyle[p.load] }}>
                  {p.load}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 12, lineHeight: 1.55 }}>{p.role}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Dashboard features ─────────────────────────────────────── */
function DashboardFeatures() {
  const features = [
    { title: "Agent Registry",      body: "Live status for all 4 agents — cap, APY, deployed USDC, and yield earned. See each delegation in its own card.", tag: "live" },
    { title: "Delegation Tree",     body: "Visual tree showing master → sub-agents with ERC-7710 permission arrows. Each node shows cap used vs available.", tag: "interactive" },
    { title: "Run swarm cycle",     body: "One click fires a real swarm tick: fetch live APY → master decides → redelegation if needed → agents collect yield → 1Shot relays gas.", tag: "demo" },
    { title: "Autopilot",          body: "Continuous swarm on a 9-second loop. Live APY from DeFiLlama + Hyperliquid. Per-panel status dots show data age.", tag: "live" },
    { title: "Portfolio panel",     body: "Total USDC deployed across all protocols with per-agent breakdown and estimated weekly yield projection.", tag: "live" },
    { title: "Execution log",       body: "Every agent action — collect-yield, redelegate, deposit — as an onchain receipt via 1Shot relayer. Gas in USDC.", tag: "new" },
  ];
  const tagStyle: Record<string, React.CSSProperties> = {
    new:         { background: "rgba(0, 1, 252, 0.12)", color: "var(--teal-text)", borderColor: "rgba(0, 1, 252, 0.32)" },
    live:        { background: "rgba(37, 99, 235, 0.10)", color: "#1d4ed8", borderColor: "rgba(37, 99, 235, 0.25)" },
    interactive: { background: "rgba(124, 58, 237, 0.10)", color: "#5b21b6", borderColor: "rgba(124, 58, 237, 0.25)" },
    demo:        { background: "rgba(217, 119, 6, 0.10)", color: "#b45309", borderColor: "rgba(217, 119, 6, 0.25)" },
  };
  return (
    <section id="dashboard" className="landing-section" style={{ background: "var(--bg-surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "96px 28px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <SectionEyebrow>Inside the dashboard</SectionEyebrow>
        <h2 style={{ fontSize: "clamp(32px, 4vw, 44px)", lineHeight: 1.08, letterSpacing: "-0.025em", maxWidth: 760, marginTop: 12 }}>
          Not a report.{" "}
          <span className="underline-curve">The swarm, running in front of you.</span>
        </h2>
        <p style={{ fontSize: 16, color: "var(--text-secondary)", marginTop: 16, maxWidth: 640, lineHeight: 1.55 }}>
          Every panel is live. Watch agents deploy capital, trigger a rebalance, or just observe the delegation tree update in real time.
        </p>
        <div style={{ marginTop: 44, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
          {features.map((f) => (
            <div key={f.title} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 0, padding: "22px 22px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>{f.title}</div>
                <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 0, border: "1px solid", ...tagStyle[f.tag] }}>{f.tag}</span>
              </div>
              <div style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 12, lineHeight: 1.6 }}>{f.body}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 32 }}>
          <Link href="/dashboard" className="btn-primary" style={{ padding: "12px 22px", fontSize: 14 }}>Open the live dashboard →</Link>
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ──────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section className="landing-section" style={{ background: "linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-base) 100%)", borderTop: "1px solid var(--border)", padding: "96px 28px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
        <SectionEyebrow centered>See the live swarm</SectionEyebrow>
        <h2 style={{ fontSize: "clamp(32px, 4vw, 44px)", lineHeight: 1.1, letterSpacing: "-0.025em", marginTop: 14 }}>
          The agents are running.
        </h2>
        <p style={{ fontSize: 16, color: "var(--text-secondary)", marginTop: 16, lineHeight: 1.55 }}>
          Open the dashboard to watch agents deploy capital, collect yield, and trigger on-chain redelegations — all from a single MetaMask permission you grant once.
        </p>
        <div style={{ marginTop: 30, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/dashboard" className="btn-primary" style={{ padding: "14px 26px", fontSize: 14 }}>Open dashboard →</Link>
          <a href="#how" className="btn-neutral-outline">Back to how it works</a>
        </div>
      </div>
    </section>
  );
}

/* ── Section eyebrow ────────────────────────────────────────── */
function SectionEyebrow({ children, centered = false }: { children: React.ReactNode; centered?: boolean }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#0001FC", margin: centered ? "0 auto" : undefined }}>
      <span style={{ display: "inline-block", width: 16, height: 1, background: "#0001FC" }} />
      {children}
    </div>
  );
}

/* ── Footer ─────────────────────────────────────────────────── */
function Footer() {
  const cols = [
    {
      heading: "Dashboard",
      links: [
        { label: "Overview",        href: "/dashboard" },
        { label: "Agent Registry",  href: "/dashboard/agents" },
        { label: "Delegation Tree", href: "/dashboard/delegations" },
        { label: "Executions",      href: "/dashboard/executions" },
        { label: "Portfolio",       href: "/dashboard/portfolio" },
        { label: "Ask the swarm",   href: "/dashboard/ask" },
      ],
    },
    {
      heading: "Learn",
      links: [
        { label: "How it works",  href: "#how" },
        { label: "Why MetaMask",  href: "#why" },
        { label: "Stack",         href: "#stack" },
        { label: "Inside the dashboard", href: "#dashboard" },
      ],
    },
    {
      heading: "Code",
      links: [{ label: "GitHub ↗", href: "https://github.com/ayushsingh82/Argo", external: true }],
    },
  ];

  return (
    <footer style={{ borderTop: "1px solid var(--border)", padding: "44px 28px 32px", background: "var(--bg-base)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "1.4fr repeat(3, 1fr)", gap: 28 }} className="footer-grid">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-brand" style={{ fontSize: 24, color: "var(--text-primary)", lineHeight: 1 }}>Nexus-A2A</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>yield swarm · metamask</span>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 12, maxWidth: 280, lineHeight: 1.55 }}>
            DeFi yield swarm. Master agent delegates via ERC-7710 to Aave, Uniswap, and Hyperliquid sub-agents. Gas in USDC via 1Shot.
          </p>
        </div>
        {cols.map((col) => (
          <div key={col.heading}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>{col.heading}</div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
              {col.links.map((l: { label: string; href: string; external?: boolean }) =>
                l.external ? (
                  <li key={l.label}><a href={l.href} target="_blank" rel="noopener noreferrer" style={footerLinkStyle}>{l.label}</a></li>
                ) : l.href.startsWith("#") ? (
                  <li key={l.label}><a href={l.href} style={footerLinkStyle}>{l.label}</a></li>
                ) : (
                  <li key={l.label}><Link href={l.href} style={footerLinkStyle}>{l.label}</Link></li>
                )
              )}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1180, margin: "28px auto 0", paddingTop: 18, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", fontSize: 12, color: "var(--text-muted)" }}>
        <span>ERC-7710 · ERC-7715 · EIP-7702 · 1Shot Relayer · Venice AI</span>
        <span>© {new Date().getFullYear()} Nexus-A2A</span>
      </div>
      <style>{`
        @media (max-width: 760px) { .footer-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 460px) { .footer-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </footer>
  );
}

const footerLinkStyle: React.CSSProperties = { fontSize: 13, color: "var(--text-secondary)", textDecoration: "none" };
