import Link from "next/link";

export default function Home() {
  return (
    <div>
      <Nav />
      <Hero />
      <Capabilities />
      <Footer />
    </div>
  );
}

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
          <a href="#stack" style={navLinkStyle}>
            Circle stack
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

function Hero() {
  return (
    <section className="hero">
      <div className="hero__wrap">
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
          <Link href="/dashboard" className="btn-primary" style={{ padding: "12px 22px", fontSize: 14 }}>
            Open the live dashboard →
          </Link>
          <a href="#how" className="btn-neutral-outline">
            How it works
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

function Capabilities() {
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
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border)",
        padding: "80px 28px",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ maxWidth: 700, marginBottom: 40 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--teal-text)",
              marginBottom: 12,
            }}
          >
            How it works
          </div>
          <h2 style={{ fontSize: 36, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            One agent. One graph. <br />
            Six things, every 500ms.
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {steps.map((s) => (
            <div key={s.n} className="card" style={{ background: "var(--bg-elevated)" }}>
              <div
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: 12,
                  color: "var(--text-muted)",
                  letterSpacing: "0.1em",
                }}
              >
                {s.n}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>
                {s.title}
              </div>
              <div style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.55 }}>
                {s.body}
              </div>
            </div>
          ))}
        </div>

        <div
          id="stack"
          style={{
            marginTop: 64,
            padding: "32px 28px",
            border: "1px solid var(--border)",
            borderRadius: 16,
            background: "var(--bg-elevated)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--teal-text)", marginBottom: 12 }}>
            Circle stack
          </div>
          <h3 style={{ fontSize: 22, marginBottom: 18 }}>
            Eight Circle products. Every one load-bearing.
          </h3>
          <div className="grid-cols-4">
            {[
              ["Wallets", "One wallet per venue"],
              ["USDC", "Working capital + settlement"],
              ["EURC", "FX-aware graph nodes"],
              ["USYC", "Idle treasury parks here"],
              ["Gateway", "Sub-500ms cross-chain"],
              ["CCTP", "Native USDC cross-chain"],
              ["Paymaster", "Gas in USDC"],
              ["Contracts", "RouteRegistry on Arc"],
            ].map(([name, desc]) => (
              <div
                key={name}
                style={{
                  padding: 14,
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  background: "var(--bg-surface)",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                  {name}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 4 }}>
                  {desc}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24 }}>
            <Link href="/dashboard" className="btn-primary" style={{ padding: "10px 18px" }}>
              See the live numbers →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        padding: "24px 28px",
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
          fontSize: 12,
          color: "var(--text-muted)",
        }}
      >
        <span>Argo · 2026 · settled on Arc</span>
        <span>USDC · EURC · USYC</span>
      </div>
    </footer>
  );
}
