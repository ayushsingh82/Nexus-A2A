"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

/* ───────────────────────────────────────────────────────────
   Argo — 8-slide pitch deck.
   1 Cover · 2 Problem · 3 Solution · 4 How it works
   5 Why Arc (moat) · 6 Audience & market · 7 Business · 8 Ask
   Arrow keys / dots / buttons to navigate.
   ─────────────────────────────────────────────────────────── */

const TOTAL = 8;

export default function PitchPage() {
  const [i, setI] = useState(0);

  const go = useCallback((next: number) => {
    setI(Math.max(0, Math.min(TOTAL - 1, next)));
  }, []);

  // Functional updates read the latest index without a render-time ref.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") setI((p) => Math.min(TOTAL - 1, p + 1));
      else if (e.key === "ArrowLeft" || e.key === "PageUp") setI((p) => Math.max(0, p - 1));
      else if (e.key === "Home") setI(0);
      else if (e.key === "End") setI(TOTAL - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const Slide = SLIDES[i];

  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-base)",
        overflow: "hidden",
      }}
    >
      <TopBar index={i} />

      <div
        key={i}
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 28px",
          animation: "pitch-in 0.32s ease",
        }}
      >
        <div style={{ width: "100%", maxWidth: 960 }}>
          <Slide />
        </div>
      </div>

      <Controls index={i} go={go} />

      <style>{`
        @keyframes pitch-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ── Chrome ────────────────────────────────────────────── */
function TopBar({ index }: { index: number }) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 24px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}
    >
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <Tile size={26} />
        <span className="font-brand" style={{ fontSize: 24, color: "var(--text-primary)", lineHeight: 1 }}>
          Argo
        </span>
        <span
          style={{
            fontSize: 10,
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            borderLeft: "1px solid var(--border)",
            paddingLeft: 10,
            marginLeft: 2,
          }}
        >
          Pitch
        </span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {String(index + 1).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}
        </span>
        <Link href="/" style={{ fontSize: 13, color: "var(--text-secondary)", textDecoration: "none" }}>
          Close ✕
        </Link>
      </div>
    </header>
  );
}

function Controls({ index, go }: { index: number; go: (n: number) => void }) {
  return (
    <footer
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 24px",
        borderTop: "1px solid var(--border)",
        flexShrink: 0,
        gap: 12,
      }}
    >
      <button
        className="btn-neutral-outline"
        onClick={() => go(index - 1)}
        disabled={index === 0}
        style={{ opacity: index === 0 ? 0.4 : 1, cursor: index === 0 ? "default" : "pointer" }}
      >
        ← Prev
      </button>

      <div style={{ display: "flex", gap: 8 }}>
        {Array.from({ length: TOTAL }).map((_, n) => (
          <button
            key={n}
            aria-label={`Go to slide ${n + 1}`}
            onClick={() => go(n)}
            style={{
              width: n === index ? 22 : 8,
              height: 8,
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: n === index ? "var(--brand-green)" : "var(--border-strong)",
              transition: "width 0.2s, background 0.2s",
              padding: 0,
            }}
          />
        ))}
      </div>

      {index === TOTAL - 1 ? (
        <Link href="/dashboard" className="btn btn-primary">
          Open dashboard →
        </Link>
      ) : (
        <button className="btn btn-primary" onClick={() => go(index + 1)}>
          Next →
        </button>
      )}
    </footer>
  );
}

/* ── Slides ────────────────────────────────────────────── */
const SLIDES: Array<() => React.ReactElement> = [
  // 1 — Cover
  function Cover() {
    return (
      <div style={{ textAlign: "center" }}>
        <Kicker centered>Pitch · 2026</Kicker>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
          <Tile size={84} />
        </div>
        <h1
          className="font-brand"
          style={{ fontSize: "clamp(64px, 12vw, 128px)", color: "var(--text-primary)", lineHeight: 0.9, marginTop: 18 }}
        >
          Argo
        </h1>
        <p
          style={{
            fontSize: "clamp(18px, 3vw, 26px)",
            color: "var(--text-primary)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            marginTop: 18,
            maxWidth: 680,
            marginInline: "auto",
            lineHeight: 1.25,
          }}
        >
          The agent that finds the free lunch before anyone else does.
        </p>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 14 }}>
          Cross-venue arbitrage, autonomous. Settled on Arc, in USDC.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
          {["Arc", "USDC", "Circle Gateway", "Negative-cycle detection"].map((t) => (
            <span key={t} className="chip chip-gray">{t}</span>
          ))}
        </div>
      </div>
    );
  },

  // 2 — Problem
  function Problem() {
    const points = [
      ["Spreads are everywhere", "Prices drift across DEXs, CEXs and chains constantly — thousands of profitable cycles open every single day."],
      ["Settlement is too slow", "By the time a trade confirms, the edge is gone. Most chains can't close the loop before the spread does."],
      ["Gas eats the math", "At retail size, fees turn a +12 bps cycle negative. The opportunity is real but uneconomic to touch."],
      ["Capital is trapped", "USDC is stranded per-venue. You can't move it to where the edge is, fast enough to matter."],
      ["The mempool punishes you", "Show your hand publicly and you get sandwiched. Edge captured by someone else's bot."],
    ];
    return (
      <Slide kicker="Problem" title={<>The spread is real. <Hl>Capturing it isn&apos;t.</Hl></>}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginTop: 28 }}>
          {points.map(([h, b]) => (
            <div key={h} style={cardStyle}>
              <div style={cardHeadStyle}>{h}</div>
              <div style={cardBodyStyle}>{b}</div>
            </div>
          ))}
          <div style={{ ...cardStyle, background: "rgba(220,38,38,0.05)", borderColor: "rgba(220,38,38,0.2)" }}>
            <div style={{ ...cardHeadStyle, color: "#b91c1c" }}>So the spread just sits there</div>
            <div style={cardBodyStyle}>Visible to everyone. Reachable by almost no one.</div>
          </div>
        </div>
      </Slide>
    );
  },

  // 3 — Solution
  function Solution() {
    const pillars = [
      ["Sees everything", "A live price graph across every venue and chain, refreshed every 500ms."],
      ["Decides honestly", "Negative-cycle detection, cost-aware to the basis point. Only fires above a 5 bps net threshold."],
      ["Acts instantly", "USDC routed via Circle Gateway + CCTP, settled atomically on Arc — before the spread vanishes."],
    ];
    return (
      <Slide kicker="Solution" title={<>One autonomous agent. <Hl>One live graph.</Hl></>}>
        <p style={lede}>
          Argo maintains a real-time price graph across spot DEXs, CEXs and
          chains, hunts negative-cycle arbitrage, sizes against liquidity, routes
          USDC where the edge is, and settles on Arc — fully autonomously.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 22 }}>
          {pillars.map(([h, b]) => (
            <div key={h} style={cardStyle}>
              <div style={{ ...cardHeadStyle, color: "var(--teal-text)" }}>{h}</div>
              <div style={cardBodyStyle}>{b}</div>
            </div>
          ))}
        </div>
      </Slide>
    );
  },

  // 4 — How it works
  function How() {
    const steps = [
      ["01", "Ingest", "Live mid prices from Hyperliquid, Uniswap, Curve & CEX feeds — every 500ms."],
      ["02", "Reason", "Bellman-Ford + SPFA over the graph surface every negative cycle."],
      ["03", "Size", "Kelly-bounded, capped by per-edge liquidity and bankroll."],
      ["04", "Route", "Gateway moves unified USDC to the source venue in <500ms; CCTP for cross-chain legs."],
      ["05", "Execute", "Legs run in deterministic order on Arc. No sandwich, no half-fill."],
      ["06", "Park", "Idle USDC sweeps into USYC for yield. The treasury never sleeps."],
    ];
    return (
      <Slide kicker="How it works" title={<>Six things, <Hl>every 500ms.</Hl></>}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 26 }} className="pitch-six">
          {steps.map(([n, h, b]) => (
            <div key={n} style={cardStyle}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "rgba(1,183,62,0.10)",
                  color: "var(--teal-text)",
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {n}
              </span>
              <div style={{ ...cardHeadStyle, marginTop: 12 }}>{h}</div>
              <div style={cardBodyStyle}>{b}</div>
            </div>
          ))}
        </div>
        <style>{`
          @media (max-width: 760px) { .pitch-six { grid-template-columns: repeat(2, 1fr) !important; } }
          @media (max-width: 480px) { .pitch-six { grid-template-columns: 1fr !important; } }
        `}</style>
      </Slide>
    );
  },

  // 5 — Why Arc (moat)
  function Moat() {
    const stats = [
      ["sub-second", "deterministic finality", "Without it, the cycle vanishes mid-settlement and the leg is stranded."],
      ["~$0.01", "per tx · paid in USDC", "Without it, the math never closes at retail size. Per-route economics depend on it."],
      ["deterministic", "execution ordering", "Sandwich-resistant by construction. The cycle executes whole or not at all."],
    ];
    return (
      <Slide kicker="Why Arc · the moat" title={<>Argo can&apos;t run profitably <Hl>anywhere else.</Hl></>}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 26 }}>
          {stats.map(([s, l, b]) => (
            <div key={l} style={cardStyle}>
              <div className="font-mono" style={{ fontSize: 30, fontWeight: 700, color: "var(--teal-text)", letterSpacing: "-0.02em" }}>
                {s}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 6 }}>
                {l}
              </div>
              <div style={{ ...cardBodyStyle, marginTop: 12 }}>{b}</div>
            </div>
          ))}
        </div>
        <p style={{ ...lede, marginTop: 22, fontWeight: 600, color: "var(--text-primary)" }}>
          The settlement substrate is the moat — not the strategy.
        </p>
      </Slide>
    );
  },

  // 6 — Audience & market
  function Market() {
    const who = [
      "Market-neutral & quant desks without low-latency infra",
      "Crypto-native funds chasing delta-neutral yield",
      "DAOs & protocol treasuries sitting on idle stablecoins",
      "Prop traders who want an always-on arb engine",
    ];
    const surface = [
      ["$200B+", "stablecoins in circulation"],
      ["$50B+", "daily spot volume across venues"],
      ["1000s/day", "cross-venue spreads that open & close"],
      ["~0%", "yield most idle treasuries earn today"],
    ];
    return (
      <Slide kicker="Audience & market" title={<>Who needs an <Hl>always-on arb desk.</Hl></>}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 24 }} className="pitch-two">
          <div style={cardStyle}>
            <div style={cardHeadStyle}>Who it&apos;s for</div>
            <ul style={{ margin: "12px 0 0", paddingLeft: 18, display: "grid", gap: 9 }}>
              {who.map((w) => (
                <li key={w} style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>{w}</li>
              ))}
            </ul>
          </div>
          <div style={cardStyle}>
            <div style={cardHeadStyle}>The surface</div>
            <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
              {surface.map(([n, l]) => (
                <div key={l} style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <span className="font-mono" style={{ fontSize: 20, fontWeight: 700, color: "var(--teal-text)", minWidth: 92 }}>
                    {n}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 12 }}>
          Market figures are directional, for sizing the opportunity.
        </p>
        <style>{`@media (max-width: 640px){ .pitch-two { grid-template-columns: 1fr !important; } }`}</style>
      </Slide>
    );
  },

  // 7 — Business
  function Business() {
    const lines = [
      ["Performance fee", "A share of net arbitrage captured. We earn only when the agent does — aligned by construction."],
      ["Managed treasury", "A cut of USYC yield earned on idle capital between trades. Idle balances stop being dead weight."],
      ["Desk subscription", "Agent access, the live route graph, and analytics for trading teams. Recurring, per-seat."],
      ["White-label / API", "Embed Argo's detection + routing engine into funds, venues and wallets."],
    ];
    return (
      <Slide kicker="Business" title={<>We get paid <Hl>when the agent does.</Hl></>}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginTop: 26 }}>
          {lines.map(([h, b], idx) => (
            <div key={h} style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>0{idx + 1}</span>
                <div style={cardHeadStyle}>{h}</div>
              </div>
              <div style={{ ...cardBodyStyle, marginTop: 8 }}>{b}</div>
            </div>
          ))}
        </div>
      </Slide>
    );
  },

  // 8 — Ask / vision
  function Ask() {
    return (
      <div style={{ textAlign: "center" }}>
        <Kicker centered>Vision</Kicker>
        <h1
          style={{
            fontSize: "clamp(34px, 6vw, 56px)",
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            marginTop: 18,
            maxWidth: 760,
            marginInline: "auto",
          }}
        >
          Every spread, on every chain, <Hl>captured.</Hl>
        </h1>
        <p style={{ ...lede, marginInline: "auto", marginTop: 18 }}>
          More venues → more chains → more assets. EURC for FX-aware cycles,
          USYC for idle yield, RWAs next. One agent, one graph, an expanding map.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 30, maxWidth: 620, marginInline: "auto" }} className="pitch-ask">
          {[
            ["Venues", "integrate your liquidity"],
            ["Capital", "back the working treasury"],
            ["Builders", "ship on the engine"],
          ].map(([h, b]) => (
            <div key={h} style={cardStyle}>
              <div style={{ ...cardHeadStyle, color: "var(--teal-text)" }}>{h}</div>
              <div style={cardBodyStyle}>{b}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
          <Link href="/dashboard" className="btn btn-primary" style={{ padding: "12px 22px", fontSize: 14 }}>
            Open the live dashboard →
          </Link>
          <Link href="/logo" className="btn-neutral-outline">
            See the brand
          </Link>
        </div>
        <style>{`@media (max-width: 560px){ .pitch-ask { grid-template-columns: 1fr !important; } }`}</style>
      </div>
    );
  },
];

/* ── Slide frame & shared bits ─────────────────────────── */
function Slide({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Kicker>{kicker}</Kicker>
      <h1
        style={{
          fontSize: "clamp(30px, 5vw, 46px)",
          lineHeight: 1.06,
          letterSpacing: "-0.025em",
          marginTop: 14,
          maxWidth: 760,
        }}
      >
        {title}
      </h1>
      {children}
    </div>
  );
}

function Kicker({ children, centered = false }: { children: React.ReactNode; centered?: boolean }) {
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
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--brand-green)" }} />
      {children}
    </div>
  );
}

function Hl({ children }: { children: React.ReactNode }) {
  return <span className="underline-curve">{children}</span>;
}

function Tile({ size = 30 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        background: "linear-gradient(145deg, #01b73e 0%, #019a35 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(1, 183, 62, 0.26)",
      }}
    >
      <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 32 32" fill="none" aria-label="Argo">
        <circle cx="16" cy="6" r="2.2" fill="#ecfdf5" />
        <circle cx="6" cy="24" r="2.2" fill="#ecfdf5" />
        <circle cx="26" cy="24" r="2.2" fill="#ecfdf5" />
        <path d="M16 6 L26 24" stroke="#ecfdf5" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M26 24 L6 24" stroke="#ecfdf5" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M6 24 L16 6" stroke="#ecfdf5" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: "18px 18px 20px",
};
const cardHeadStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: "-0.01em",
  color: "var(--text-primary)",
};
const cardBodyStyle: React.CSSProperties = {
  fontSize: 13.5,
  color: "var(--text-secondary)",
  marginTop: 8,
  lineHeight: 1.55,
};
const lede: React.CSSProperties = {
  fontSize: 16,
  color: "var(--text-secondary)",
  marginTop: 18,
  maxWidth: 660,
  lineHeight: 1.6,
};
