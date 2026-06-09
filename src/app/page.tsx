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
      <WhyArc />
      <CircleStack />
      <DashboardFeatures />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ── Top nav ───────────────────────────────────────────── */
function Nav() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "rgba(255,255,255,0.78)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, opacity: 0.55, pointerEvents: "none" }}>
        <HeaderBackground />
      </div>
      <div
        className="landing-nav"
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1180,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <span
            className="font-brand"
            style={{ fontSize: 28, color: "var(--text-primary)", lineHeight: 1 }}
          >
            Argo
          </span>
        </Link>
        <nav className="landing-nav__links">
          <a href="#how" style={navLinkStyle} className="landing-nav__hide-sm">
            How it works
          </a>
          <a href="#arc" style={navLinkStyle} className="landing-nav__hide-sm">
            Why Arc
          </a>
          <a href="#stack" style={navLinkStyle} className="landing-nav__hide-sm">
            Stack
          </a>
          <a href="#dashboard" style={navLinkStyle} className="landing-nav__hide-sm">
            Dashboard
          </a>
          <Link href="/dashboard" className="btn-brand-outline">
            Open dashboard →
          </Link>
        </nav>
      </div>
    </header>
  );
}

const navLinkStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--text-secondary)",
  textDecoration: "none",
  fontWeight: 500,
};

/* ── Hero with PixelBlast ──────────────────────────────── */
function Hero() {
  return (
    <section className="hero" style={{ position: "relative", overflow: "hidden" }}>
      <HeroBackground />
      <div className="hero__wrap" style={{ position: "relative", zIndex: 1 }}>
        <div className="hero__eyebrow">
          <span className="hero__eyebrow-dot" />
          Live arbitrage agent · Arc · USDC
        </div>
        <h1 className="hero__title">
          The agent that finds the{" "}
          <span className="underline-curve">free lunch</span> before anyone
          else does.
        </h1>
        <p className="hero__subtitle">
          Argo maintains a live price graph across spot DEXs, CEXs, and chains.
          It hunts negative-cycle arbitrage, sizes against liquidity, routes
          USDC through Circle Gateway + CCTP, and settles on Arc — all before
          the spread vanishes.
        </p>
        <div className="hero__ctas">
          <Link
            href="/dashboard"
            className="btn-primary"
            style={{ padding: "12px 22px", fontSize: 14 }}
          >
            Open the live dashboard →
          </Link>
          <a href="#how" className="btn-neutral-outline">
            See how it works
          </a>
        </div>

        <div className="hero__stats">
          <div className="hero__stat">
            <div className="hero__stat-label">Finality</div>
            <div className="hero__stat-value">sub-second</div>
          </div>
          <div className="hero__stat">
            <div className="hero__stat-label">Per-tx cost</div>
            <div className="hero__stat-value">~$0.01 USDC</div>
          </div>
          <div className="hero__stat">
            <div className="hero__stat-label">Cross-chain</div>
            <div className="hero__stat-value">Gateway · 500ms</div>
          </div>
          <div className="hero__stat">
            <div className="hero__stat-label">Idle capital</div>
            <div className="hero__stat-value">USYC yield</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Live ticker (looks like real signal flowing) ──────── */
function Ticker() {
  const items = [
    { tag: "TRADE", text: "USDC → ETH → USDC · uni-eth ▸ uni-base · +12.4 bps · $14.88", color: "green" },
    { tag: "SCAN", text: "1,842 cycles evaluated in last 60s · 4 above threshold", color: "blue" },
    { tag: "ROUTE", text: "8,400 USDC · Gateway · ARC → ETH · 412ms", color: "amber" },
    { tag: "PARK", text: "1,240 USDC swept → USYC · idle yield", color: "green" },
    { tag: "TRADE", text: "USDC → EURC → USDC · curve ▸ uni-arb · +7.1 bps · $5.32", color: "green" },
    { tag: "TRADE", text: "USDC → BTC → USDC · binance ▸ hl · +9.8 bps · $19.60", color: "green" },
  ];
  return (
    <section
      style={{
        background: "var(--bg-base)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        padding: "16px 0",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 32,
          whiteSpace: "nowrap",
          animation: "ticker 60s linear infinite",
          width: "max-content",
        }}
      >
        {[...items, ...items, ...items].map((it, i) => (
          <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
            <span className={`chip chip-${it.color}`}>{it.tag}</span>
            <span style={{ color: "var(--text-secondary)" }} className="font-mono">
              {it.text}
            </span>
            <span style={{ color: "var(--border-strong)", marginLeft: 12 }}>·</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </section>
  );
}

/* ── Agent loop (replaces the flat capability grid) ───── */
function AgentLoop() {
  const steps = [
    {
      n: "01",
      title: "Ingest",
      body: "Real-time mid prices from Hyperliquid, Uniswap (Ethereum, Base, Arbitrum), Curve, and public CEX websockets — refreshed every 500ms.",
    },
    {
      n: "02",
      title: "Reason",
      body: "Edges weighted by −log(rate × (1 − fees − slippage)). Bellman-Ford + SPFA over the live graph surface every negative cycle.",
    },
    {
      n: "03",
      title: "Size",
      body: "Kelly-bounded sizing capped by per-edge liquidity and bankroll. Cost-honest threshold: 5 bps net of fees + slippage.",
    },
    {
      n: "04",
      title: "Route",
      body: "Circle Gateway moves the unified USDC balance to the source venue in <500ms. Cross-chain legs settle via CCTP.",
    },
    {
      n: "05",
      title: "Execute",
      body: "Legs run in deterministic order on Arc. Sub-second finality means no sandwich, no reorg, no half-filled cycle.",
    },
    {
      n: "06",
      title: "Park",
      body: "When no profitable cycle exists, idle USDC sweeps into USYC for yield. The treasury never sleeps.",
    },
  ];
  return (
    <section
      id="how"
      className="landing-section"
      style={{
        background: "var(--bg-base)",
        padding: "96px 28px",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <SectionEyebrow>How it works</SectionEyebrow>
        <h2
          style={{
            fontSize: "clamp(32px, 4vw, 44px)",
            lineHeight: 1.08,
            letterSpacing: "-0.025em",
            maxWidth: 720,
            marginTop: 12,
          }}
        >
          One agent. One graph.{" "}
          <span className="underline-curve">Six things, every 500ms.</span>
        </h2>
        <p
          style={{
            fontSize: 16,
            color: "var(--text-secondary)",
            marginTop: 16,
            maxWidth: 620,
            lineHeight: 1.55,
          }}
        >
          The agent never stops. Every half-second it ingests, reasons, sizes,
          routes, executes, and rebalances — then does it again.
        </p>

        <div
          style={{
            position: "relative",
            marginTop: 56,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 0,
            border: "1px solid var(--border)",
            borderRadius: 16,
            overflow: "hidden",
            background: "var(--bg-elevated)",
          }}
          className="agent-loop"
        >
          {steps.map((s, i) => (
            <div
              key={s.n}
              style={{
                position: "relative",
                padding: "28px 26px",
                borderRight: (i + 1) % 3 !== 0 ? "1px solid var(--border)" : "none",
                borderBottom: i < 3 ? "1px solid var(--border)" : "none",
                background: "var(--bg-elevated)",
                transition: "background 0.2s",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: "rgba(1, 183, 62, 0.10)",
                  color: "var(--teal-text)",
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  fontSize: 19,
                  fontWeight: 700,
                  marginTop: 14,
                  letterSpacing: "-0.01em",
                  color: "var(--text-primary)",
                }}
              >
                {s.title}
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  color: "var(--text-secondary)",
                  marginTop: 8,
                  lineHeight: 1.6,
                }}
              >
                {s.body}
              </div>
            </div>
          ))}
        </div>

        <style>{`
          @media (max-width: 900px) {
            .agent-loop { grid-template-columns: repeat(2, 1fr) !important; }
            .agent-loop > div { border-right: none !important; border-bottom: 1px solid var(--border) !important; }
          }
          @media (max-width: 600px) {
            .agent-loop { grid-template-columns: 1fr !important; }
            .agent-loop > div { border-right: none !important; }
          }
        `}</style>
      </div>
    </section>
  );
}

/* ── Why Arc (the physics strip) ───────────────────────── */
function WhyArc() {
  const physics = [
    {
      stat: "sub-second",
      label: "deterministic finality",
      body: "Without it, the cycle vanishes during settlement and the leg is stranded mid-route.",
    },
    {
      stat: "~$0.01",
      label: "per-tx · paid in USDC",
      body: "Without it, the math never closes at retail size. Per-route economics depend on it.",
    },
    {
      stat: "deterministic",
      label: "execution ordering",
      body: "Sandwich-resistant by construction. The cycle either executes whole or not at all.",
    },
  ];
  return (
    <section
      id="arc"
      className="landing-section"
      style={{
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        padding: "96px 28px",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <SectionEyebrow>Why Arc is load-bearing</SectionEyebrow>
        <h2
          style={{
            fontSize: "clamp(28px, 3.5vw, 40px)",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            maxWidth: 760,
            marginTop: 12,
          }}
        >
          Argo cannot run profitably on any other settlement substrate.
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 14,
            marginTop: 40,
          }}
        >
          {physics.map((p) => (
            <div
              key={p.label}
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: "26px 24px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: 32,
                  fontWeight: 700,
                  color: "var(--teal-text)",
                  letterSpacing: "-0.02em",
                }}
              >
                {p.stat}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginTop: 6,
                }}
              >
                {p.label}
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  color: "var(--text-secondary)",
                  marginTop: 14,
                  lineHeight: 1.55,
                }}
              >
                {p.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Circle stack (badge grid) ─────────────────────────── */
function CircleStack() {
  const products = [
    { name: "Wallets",   role: "One Circle Wallet per venue, holding venue-specific working USDC.", load: "core" },
    { name: "USDC",      role: "Native settlement currency and working capital across every leg.", load: "core" },
    { name: "EURC",      role: "FX-aware nodes in the graph — the only EURC arb actually viable.", load: "unique" },
    { name: "USYC",      role: "Idle treasury sweeps here for yield between captured arbs.", load: "unique" },
    { name: "Gateway",   role: "Unified balance + sub-500ms cross-chain. The speed mechanism.", load: "critical" },
    { name: "CCTP",      role: "Native USDC bridges for routes that span chains.", load: "critical" },
    { name: "Paymaster", role: "All gas paid in USDC — clean per-route PnL accounting.", load: "core" },
    { name: "Contracts", role: "RouteRegistry on Arc — every captured arb is an onchain receipt.", load: "core" },
  ];
  const loadStyle: Record<string, React.CSSProperties> = {
    critical: { background: "rgba(1, 183, 62, 0.12)", color: "var(--teal-text)", borderColor: "rgba(1, 183, 62, 0.32)" },
    unique:   { background: "rgba(37, 99, 235, 0.10)", color: "#1d4ed8", borderColor: "rgba(37, 99, 235, 0.25)" },
    core:     { background: "rgba(0, 0, 0, 0.04)",     color: "var(--text-secondary)", borderColor: "var(--border-strong)" },
  };
  const loadLabel: Record<string, string> = {
    critical: "critical",
    unique: "unique-to-circle",
    core: "core",
  };
  return (
    <section
      id="stack"
      className="landing-section"
      style={{
        background: "var(--bg-base)",
        padding: "96px 28px",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <SectionEyebrow>Circle stack</SectionEyebrow>
        <h2
          style={{
            fontSize: "clamp(32px, 4vw, 44px)",
            lineHeight: 1.08,
            letterSpacing: "-0.025em",
            maxWidth: 760,
            marginTop: 12,
          }}
        >
          Eight Circle products.{" "}
          <span className="underline-curve">Every one load-bearing.</span>
        </h2>
        <p
          style={{
            fontSize: 16,
            color: "var(--text-secondary)",
            marginTop: 16,
            maxWidth: 620,
            lineHeight: 1.55,
          }}
        >
          Not bolted-on. If you removed any of these, the agent stops working.
        </p>

        <div
          style={{
            marginTop: 44,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          {products.map((p) => (
            <div
              key={p.name}
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "20px 20px 22px",
                position: "relative",
                transition: "border-color 0.15s, transform 0.15s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                    color: "var(--text-primary)",
                  }}
                >
                  {p.name}
                </div>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    borderRadius: 999,
                    border: "1px solid",
                    ...loadStyle[p.load],
                  }}
                >
                  {loadLabel[p.load]}
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  marginTop: 12,
                  lineHeight: 1.55,
                }}
              >
                {p.role}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Dashboard features ────────────────────────────────── */
function DashboardFeatures() {
  const features = [
    {
      title: "Live route graph",
      body: "Tokens on a ring, every tradable edge as a chord, and the best negative cycle drawn in green — with a USDC packet flowing the loop in real time.",
      tag: "interactive",
    },
    {
      title: "Autopilot scanning",
      body: "Continuous scans of real Hyperliquid, Binance, and Chainlink prices. Per-panel status dots show live / stale and 'updated Ns ago' so you know the data is real.",
      tag: "live",
    },
    {
      title: "Run capture cycle",
      body: "One click animates the full pipeline — scan → graph → detect → size → Gateway → CCTP → execute → settle on Arc → park in USYC — and fires an actual scan.",
      tag: "demo",
    },
    {
      title: "Ask the swarm",
      body: "Ask anything in plain English. Answers are computed live from the current edges, cycles, treasury, and receipts — never canned, no fixed questions.",
      tag: "new",
    },
    {
      title: "Realized-PnL curve",
      body: "Cumulative USDC captured across every settled cycle, drawn straight from onchain receipts on Arc.",
      tag: "live",
    },
    {
      title: "Gateway-unified treasury",
      body: "One balance across all venues via Circle Gateway, with idle capital parked in USYC and FX-aware EURC — all updating as the agent runs.",
      tag: "circle",
    },
  ];
  const tagStyle: Record<string, React.CSSProperties> = {
    new: { background: "rgba(1, 183, 62, 0.12)", color: "var(--teal-text)", borderColor: "rgba(1, 183, 62, 0.32)" },
    live: { background: "rgba(37, 99, 235, 0.10)", color: "#1d4ed8", borderColor: "rgba(37, 99, 235, 0.25)" },
    interactive: { background: "rgba(124, 58, 237, 0.10)", color: "#5b21b6", borderColor: "rgba(124, 58, 237, 0.25)" },
    demo: { background: "rgba(217, 119, 6, 0.10)", color: "#b45309", borderColor: "rgba(217, 119, 6, 0.25)" },
    circle: { background: "rgba(0, 0, 0, 0.04)", color: "var(--text-secondary)", borderColor: "var(--border-strong)" },
  };
  return (
    <section
      id="dashboard"
      className="landing-section"
      style={{
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        padding: "96px 28px",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <SectionEyebrow>Inside the dashboard</SectionEyebrow>
        <h2
          style={{
            fontSize: "clamp(32px, 4vw, 44px)",
            lineHeight: 1.08,
            letterSpacing: "-0.025em",
            maxWidth: 760,
            marginTop: 12,
          }}
        >
          Not a report.{" "}
          <span className="underline-curve">The agent, running in front of you.</span>
        </h2>
        <p style={{ fontSize: 16, color: "var(--text-secondary)", marginTop: 16, maxWidth: 640, lineHeight: 1.55 }}>
          Every panel is live, on real venue prices. Watch cycles form, fire a
          capture end to end, or just ask the swarm what it&apos;s seeing.
        </p>

        <div
          style={{
            marginTop: 44,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: "22px 22px 24px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
                  {f.title}
                </div>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    borderRadius: 999,
                    border: "1px solid",
                    ...tagStyle[f.tag],
                  }}
                >
                  {f.tag}
                </span>
              </div>
              <div style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 12, lineHeight: 1.6 }}>
                {f.body}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32 }}>
          <Link href="/dashboard" className="btn-primary" style={{ padding: "12px 22px", fontSize: 14 }}>
            Open the live dashboard →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ─────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section
      className="landing-section"
      style={{
        background: "linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-base) 100%)",
        borderTop: "1px solid var(--border)",
        padding: "96px 28px",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <SectionEyebrow centered>See the live numbers</SectionEyebrow>
        <h2
          style={{
            fontSize: "clamp(32px, 4vw, 44px)",
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            marginTop: 14,
          }}
        >
          The agent is running.
        </h2>
        <p
          style={{
            fontSize: 16,
            color: "var(--text-secondary)",
            marginTop: 16,
            lineHeight: 1.55,
          }}
        >
          Open the dashboard to watch opportunities flow through the graph,
          executions land on Arc, and idle capital park in USYC.
        </p>
        <div
          style={{
            marginTop: 30,
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/dashboard"
            className="btn-primary"
            style={{ padding: "14px 26px", fontSize: 14 }}
          >
            Open dashboard →
          </Link>
          <a href="#how" className="btn-neutral-outline">
            Back to how it works
          </a>
        </div>
      </div>
    </section>
  );
}

/* ── Section eyebrow ───────────────────────────────────── */
function SectionEyebrow({
  children,
  centered = false,
}: {
  children: React.ReactNode;
  centered?: boolean;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--teal-text)",
        padding: "5px 12px",
        borderRadius: 999,
        background: "rgba(1, 183, 62, 0.10)",
        border: "1px solid rgba(1, 183, 62, 0.22)",
        margin: centered ? "0 auto" : undefined,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "var(--brand-green)",
        }}
      />
      {children}
    </div>
  );
}

/* ── Footer ────────────────────────────────────────────── */
function Footer() {
  // Only routes/sections that actually exist in the app.
  const cols: { heading: string; links: { label: string; href: string; external?: boolean }[] }[] = [
    {
      heading: "Dashboard",
      links: [
        { label: "Overview", href: "/dashboard" },
        { label: "Route Graph", href: "/dashboard/graph" },
        { label: "Venues", href: "/dashboard/venues" },
        { label: "Executions", href: "/dashboard/executions" },
        { label: "Treasury", href: "/dashboard/treasury" },
        { label: "Wallets", href: "/dashboard/wallets" },
        { label: "Arc Network", href: "/dashboard/network" },
      ],
    },
    {
      heading: "Learn",
      links: [
        { label: "How it works", href: "#how" },
        { label: "Why Arc", href: "#arc" },
        { label: "Circle stack", href: "#stack" },
        { label: "Inside the dashboard", href: "#dashboard" },
      ],
    },
    {
      heading: "Code",
      links: [{ label: "GitHub ↗", href: "https://github.com/ayushsingh82/Argo", external: true }],
    },
  ];

  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        padding: "44px 28px 32px",
        background: "var(--bg-base)",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1.4fr repeat(3, 1fr)",
          gap: 28,
        }}
        className="footer-grid"
      >
        <div>
          <div className="flex items-center gap-3">
            <span className="font-brand" style={{ fontSize: 24, color: "var(--text-primary)", lineHeight: 1 }}>
              Argo
            </span>
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              arb agent · arc
            </span>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 12, maxWidth: 280, lineHeight: 1.55 }}>
            Cross-venue arbitrage agent. One live price graph, negative-cycle
            detection, real USDC — settled on Arc.
          </p>
        </div>

        {cols.map((col) => (
          <div key={col.heading}>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: 12,
              }}
            >
              {col.heading}
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
              {col.links.map((l) =>
                l.external ? (
                  <li key={l.label}>
                    <a href={l.href} target="_blank" rel="noopener noreferrer" style={footerLinkStyle}>
                      {l.label}
                    </a>
                  </li>
                ) : l.href.startsWith("#") ? (
                  <li key={l.label}>
                    <a href={l.href} style={footerLinkStyle}>
                      {l.label}
                    </a>
                  </li>
                ) : (
                  <li key={l.label}>
                    <Link href={l.href} style={footerLinkStyle}>
                      {l.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      </div>

      <div
        style={{
          maxWidth: 1180,
          margin: "28px auto 0",
          paddingTop: 18,
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          fontSize: 12,
          color: "var(--text-muted)",
        }}
      >
        <span>settled on Arc · USDC · EURC · USYC</span>
        <span>© {new Date().getFullYear()} Argo</span>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 460px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}

const footerLinkStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--text-secondary)",
  textDecoration: "none",
};
