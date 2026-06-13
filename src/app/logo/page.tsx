"use client";

import Link from "next/link";
import { useState } from "react";

/* ───────────────────────────────────────────────────────────
   The Argo mark: a triangle = one closed arbitrage cycle.
   Three nodes (venues), three edges (legs). Buy → buy → sell,
   back to where you started, with more than you left with.
   ─────────────────────────────────────────────────────────── */
function ArgoMark({ size = 40, color = "#ffffff" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Argo mark"
    >
      <circle cx="16" cy="6" r="2.2" fill={color} />
      <circle cx="6" cy="24" r="2.2" fill={color} />
      <circle cx="26" cy="24" r="2.2" fill={color} />
      <path d="M16 6 L26 24" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M26 24 L6 24" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6 24 L16 6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/* Standalone SVG string for download — same geometry, scaled to 256. */
function markSvgString(color: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 32 32" fill="none">
  <circle cx="16" cy="6" r="2.2" fill="${color}"/>
  <circle cx="6" cy="24" r="2.2" fill="${color}"/>
  <circle cx="26" cy="24" r="2.2" fill="${color}"/>
  <path d="M16 6 L26 24" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M26 24 L6 24" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M6 24 L16 6" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>
</svg>
`;
}

function downloadSvg(filename: string, svg: string) {
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* The brand tile — green gradient square holding the white mark. */
function BrandTile({ size = 96, mark = 0.52 }: { size?: number; mark?: number }) {
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
        boxShadow: "0 6px 20px rgba(1, 183, 62, 0.28)",
      }}
    >
      <ArgoMark size={size * mark} color="#ecfdf5" />
    </div>
  );
}

export default function LogoPage() {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-base)" }}>
      <TopBar />

      <main style={{ maxWidth: 980, margin: "0 auto", padding: "56px 28px 96px" }}>
        <Eyebrow>Brand · Logo</Eyebrow>
        <h1
          style={{
            fontSize: "clamp(34px, 5vw, 52px)",
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            marginTop: 14,
            maxWidth: 720,
          }}
        >
          The Argo mark is a{" "}
          <span className="underline-curve">closed arbitrage cycle.</span>
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "var(--text-secondary)",
            marginTop: 16,
            maxWidth: 600,
            lineHeight: 1.6,
          }}
        >
          Three nodes, three edges, one loop — buy, buy, sell, and land back
          where you started holding more than you left with. The whole product,
          in one triangle.
        </p>

        <PrimaryLockup />
        <Variants />
        <Wordmark />
        <Clearspace />
        <Palette />
        <Meaning />
      </main>

      <Footer />
    </div>
  );
}

/* ── Top bar ───────────────────────────────────────────── */
function TopBar() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "rgba(255,255,255,0.82)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <BrandTile size={30} />
          <span className="font-brand" style={{ fontSize: 26, color: "var(--text-primary)", lineHeight: 1 }}>
            Argo
          </span>
        </Link>
        <nav style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <Link href="/pitch" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", textDecoration: "none" }}>
            Pitch
          </Link>
          <Link href="/dashboard" className="btn-brand-outline">
            Open dashboard →
          </Link>
        </nav>
      </div>
    </header>
  );
}

/* ── Primary lockup ────────────────────────────────────── */
function PrimaryLockup() {
  return (
    <section style={{ marginTop: 48 }}>
      <SubLabel>Primary lockup</SubLabel>
      <div
        style={{
          marginTop: 12,
          border: "1px solid var(--border)",
          borderRadius: 0,
          background: "var(--bg-surface)",
          padding: "64px 28px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 22 }}>
          <BrandTile size={108} />
          <span
            className="font-brand"
            style={{ fontSize: 92, color: "var(--text-primary)", lineHeight: 0.9 }}
          >
            Argo
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            className="btn btn-primary"
            onClick={() => downloadSvg("argo-mark.svg", markSvgString("#ecfdf5"))}
          >
            ↓ Mark (knockout)
          </button>
          <button
            className="btn-neutral-outline"
            onClick={() => downloadSvg("argo-mark-green.svg", markSvgString("#01b73e"))}
          >
            ↓ Mark (green)
          </button>
          <button
            className="btn-neutral-outline"
            onClick={() => downloadSvg("argo-mark-ink.svg", markSvgString("#0a0a0a"))}
          >
            ↓ Mark (ink)
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Variants ──────────────────────────────────────────── */
function Variants() {
  const tiles: { label: string; bg: string; mark: string; border?: boolean }[] = [
    { label: "On brand", bg: "linear-gradient(145deg, #01b73e 0%, #019a35 100%)", mark: "#ecfdf5" },
    { label: "On ink", bg: "#0a0a0a", mark: "#ffffff" },
    { label: "On paper", bg: "#ffffff", mark: "#01b73e", border: true },
    { label: "Monochrome", bg: "#fafafa", mark: "#0a0a0a", border: true },
  ];
  return (
    <section style={{ marginTop: 44 }}>
      <SubLabel>Mark variants</SubLabel>
      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
        }}
      >
        {tiles.map((t) => (
          <div
            key={t.label}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 0,
              overflow: "hidden",
              background: "var(--bg-elevated)",
            }}
          >
            <div
              style={{
                background: t.bg,
                height: 150,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderBottom: t.border ? "1px solid var(--border)" : "none",
              }}
            >
              <ArgoMark size={64} color={t.mark} />
            </div>
            <div
              style={{
                padding: "12px 14px",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-secondary)",
                letterSpacing: "0.04em",
              }}
            >
              {t.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Wordmark ──────────────────────────────────────────── */
function Wordmark() {
  return (
    <section style={{ marginTop: 44 }}>
      <SubLabel>Wordmark</SubLabel>
      <div
        style={{
          marginTop: 12,
          border: "1px solid var(--border)",
          borderRadius: 0,
          background: "var(--bg-elevated)",
          padding: "40px 28px",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <span className="font-brand" style={{ fontSize: 76, color: "var(--text-primary)", lineHeight: 0.9 }}>
          Argo
        </span>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 280 }}>
          Set in <strong style={{ color: "var(--text-secondary)" }}>Allura</strong>. Lowercase, flowing —
          a calm signature against the precise geometry of the mark.
        </span>
      </div>
    </section>
  );
}

/* ── Clearspace & min size ─────────────────────────────── */
function Clearspace() {
  return (
    <section style={{ marginTop: 44 }}>
      <SubLabel>Clearspace &amp; minimum size</SubLabel>
      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 14,
        }}
        className="logo-clearspace-grid"
      >
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 0,
            background: "var(--bg-elevated)",
            padding: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ position: "relative", padding: 36 }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                border: "1px dashed var(--border-strong)",
                borderRadius: 0,
              }}
            />
            <BrandTile size={84} />
          </div>
        </div>
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 0,
            background: "var(--bg-elevated)",
            padding: 24,
          }}
        >
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
            Keep clearspace of at least <strong style={{ color: "var(--text-primary)" }}>½ the mark</strong>{" "}
            on every side. Don&apos;t crowd it.
          </p>
          <div
            style={{
              marginTop: 18,
              paddingTop: 18,
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <BrandTile size={24} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>24px minimum</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>below this, drop the wordmark</div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 640px) {
          .logo-clearspace-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

/* ── Palette ───────────────────────────────────────────── */
function Palette() {
  const colors = [
    { name: "Brand green", hex: "#01b73e", text: "#ffffff" },
    { name: "Green dim", hex: "#019a35", text: "#ffffff" },
    { name: "Mint", hex: "#d1fae5", text: "#016b2e" },
    { name: "Ink", hex: "#0a0a0a", text: "#ffffff" },
    { name: "Paper", hex: "#ffffff", text: "#0a0a0a", border: true },
  ];
  const [copied, setCopied] = useState<string | null>(null);

  return (
    <section style={{ marginTop: 44 }}>
      <SubLabel>Palette</SubLabel>
      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 14,
        }}
      >
        {colors.map((c) => (
          <button
            key={c.hex}
            onClick={() => {
              navigator.clipboard?.writeText(c.hex);
              setCopied(c.hex);
              setTimeout(() => setCopied((v) => (v === c.hex ? null : v)), 1200);
            }}
            style={{
              textAlign: "left",
              border: "1px solid var(--border)",
              borderRadius: 0,
              overflow: "hidden",
              background: "var(--bg-elevated)",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <div
              style={{
                height: 76,
                background: c.hex,
                borderBottom: c.border ? "1px solid var(--border)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: c.text,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
              }}
            >
              {copied === c.hex ? "COPIED ✓" : ""}
            </div>
            <div style={{ padding: "10px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{c.name}</div>
              <div className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                {c.hex}
              </div>
            </div>
          </button>
        ))}
      </div>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10 }}>
        Click any swatch to copy its hex.
      </p>
    </section>
  );
}

/* ── Meaning ───────────────────────────────────────────── */
function Meaning() {
  const rows = [
    { node: "Three nodes", body: "Each is a venue or asset in the price graph — a place capital can rest." },
    { node: "Three edges", body: "Each is a tradable leg, weighted by −log(rate × (1 − fees − slippage))." },
    { node: "One closed loop", body: "A negative cycle: end where you began, holding more. That's the arb." },
  ];
  return (
    <section style={{ marginTop: 44 }}>
      <SubLabel>What it means</SubLabel>
      <div
        style={{
          marginTop: 12,
          border: "1px solid var(--border)",
          borderRadius: 0,
          background: "var(--bg-surface)",
          padding: "8px 4px",
        }}
      >
        {rows.map((r, i) => (
          <div
            key={r.node}
            style={{
              display: "flex",
              gap: 16,
              padding: "16px 20px",
              borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
              alignItems: "baseline",
            }}
          >
            <div
              style={{
                minWidth: 120,
                fontSize: 13.5,
                fontWeight: 700,
                color: "var(--teal-text)",
              }}
            >
              {r.node}
            </div>
            <div style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>{r.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Shared bits ───────────────────────────────────────── */
function Eyebrow({ children }: { children: React.ReactNode }) {
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
        borderRadius: 0,
        background: "rgba(1, 183, 62, 0.10)",
        border: "1px solid rgba(1, 183, 62, 0.22)",
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--brand-green)" }} />
      {children}
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--text-muted)",
      }}
    >
      {children}
    </div>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", background: "var(--bg-base)" }}>
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "24px 28px",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          fontSize: 12,
          color: "var(--text-muted)",
        }}
      >
        <Link href="/" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
          ← Back to Argo
        </Link>
        <span>brand assets · the mark is a closed cycle</span>
      </div>
    </footer>
  );
}
