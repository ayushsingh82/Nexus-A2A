import Link from "next/link";
import HeroBackground from "@/components/HeroBackground";

export default function Home() {
  return (
    <div>
      <Nav />
      <Hero />
      <Ticker />
      <AgentLoop />
      <WhyArc />
      <CircleStack />
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
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "14px 28px",
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
        <nav style={{ display: "flex", gap: 22, alignItems: "center" }}>
          <a href="#how" style={navLinkStyle}>
            How it works
          </a>
          <a href="#arc" style={navLinkStyle}>
            Why Arc
          </a>
          <a href="#stack" style={navLinkStyle}>
            Stack
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

/* ── Final CTA ─────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section
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
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        padding: "32px 28px",
        background: "var(--bg-base)",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="font-brand"
            style={{ fontSize: 22, color: "var(--text-primary)", lineHeight: 1 }}
          >
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
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          settled on Arc · USDC · EURC · USYC
        </div>
      </div>
    </footer>
  );
}
