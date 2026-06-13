"use client";

import { useEffect, useState } from "react";
import { ARC_TESTNET_FAUCET, explorerAddress } from "@/lib/arc";

type WalletRow = {
  walletId: string;
  address: string;
  blockchain: string;
  balances: Record<string, number>;
};

type GetResp =
  | { ok: true; configured: true; wallets: WalletRow[] }
  | { ok: false; configured: false; reason: string }
  | { ok: false; configured: true; error: string };

type ProvisionResp =
  | {
      ok: true;
      walletSetId: string;
      wallets: Array<{ refId: string; address: string; walletId: string; chainId: number }>;
    }
  | { ok: false; reason?: string; error?: string };

export default function WalletsPage() {
  const [data, setData] = useState<GetResp | null>(null);
  const [busy, setBusy] = useState(false);
  const [provisioned, setProvisioned] = useState<ProvisionResp | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const refresh = async () => {
    setErr(null);
    try {
      const r = await fetch("/api/wallets", { cache: "no-store" });
      const j = (await r.json()) as GetResp;
      setData(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const provision = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/wallets", { method: "POST" });
      const j = (await r.json()) as ProvisionResp;
      setProvisioned(j);
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const notConfigured = data && data.ok === false && "configured" in data && data.configured === false;
  const apiError = data && data.ok === false && "error" in data;

  return (
    <div className="page-content">
      <section className="card" style={{ padding: 24 }}>
        <div className="section-title">Circle Wallets · Arc Testnet</div>
        <p style={{ marginTop: 6, fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          One Circle Wallet per venue plus a treasury wallet, all on{" "}
          <code>ARC-TESTNET</code>. Provision them, then fund each at{" "}
          <a href={ARC_TESTNET_FAUCET} target="_blank" rel="noreferrer" style={{ color: "var(--teal-text)" }}>
            {ARC_TESTNET_FAUCET}
          </a>{" "}
          with USDC (gas + working capital) and EURC (FX leg).
        </p>

        <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={provision}
            disabled={busy || notConfigured === true}
            className="btn-primary"
            style={{ padding: "10px 18px", fontSize: 13, opacity: busy || notConfigured ? 0.6 : 1 }}
          >
            {busy ? "Provisioning…" : "Provision Circle Wallets"}
          </button>
          <button
            onClick={refresh}
            className="btn-neutral-outline"
            style={{ padding: "10px 18px", fontSize: 13 }}
          >
            Refresh
          </button>
        </div>

        {notConfigured && (
          <Banner kind="warn">
            Circle SDK not configured.{" "}
            <span style={{ fontFamily: "var(--font-geist-mono)" }}>
              {(data as { reason: string }).reason}
            </span>
            . Set <code>CIRCLE_API_KEY</code> + <code>CIRCLE_ENTITY_SECRET</code> in{" "}
            <code>.env.local</code>, then{" "}
            <code>npm i @circle-fin/developer-controlled-wallets</code>.
          </Banner>
        )}
        {apiError && (
          <Banner kind="error">
            Circle API error:{" "}
            <span style={{ fontFamily: "var(--font-geist-mono)" }}>
              {(data as { error: string }).error}
            </span>
          </Banner>
        )}
        {err && <Banner kind="error">{err}</Banner>}
        {provisioned && provisioned.ok && (
          <Banner kind="ok">
            Provisioned WalletSet <code>{provisioned.walletSetId}</code> with{" "}
            {provisioned.wallets.length} wallets.
          </Banner>
        )}
      </section>

      <section className="card" style={{ padding: 0, marginTop: 16, overflow: "hidden" }}>
        <header style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <div className="section-title">Live wallets</div>
        </header>
        {data && data.ok && data.wallets.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-surface)" }}>
                <Th>Wallet ID</Th>
                <Th>Address</Th>
                <Th>Chain</Th>
                <Th align="right">USDC</Th>
                <Th align="right">EURC</Th>
                <Th align="right">USYC</Th>
              </tr>
            </thead>
            <tbody>
              {data.wallets.map((w) => (
                <tr key={w.walletId}>
                  <Td mono>{w.walletId.slice(0, 10)}…</Td>
                  <Td mono>
                    <a
                      href={explorerAddress(w.address)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--teal-text)", textDecoration: "none" }}
                    >
                      {w.address}
                    </a>
                  </Td>
                  <Td mono>{w.blockchain}</Td>
                  <Td mono align="right">{(w.balances.USDC ?? 0).toLocaleString()}</Td>
                  <Td mono align="right">{(w.balances.EURC ?? 0).toLocaleString()}</Td>
                  <Td mono align="right">{(w.balances.USYC ?? 0).toLocaleString()}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: "44px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            {data && data.ok && data.wallets.length === 0
              ? "No wallets yet. Click Provision Circle Wallets to create them."
              : notConfigured
                ? "Configure Circle credentials, then provision."
                : "Loading wallets…"}
          </div>
        )}
      </section>

      {provisioned && provisioned.ok && (
        <section className="card" style={{ padding: 0, marginTop: 16, overflow: "hidden" }}>
          <header style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
            <div className="section-title">Just provisioned</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Copy each address below and request testnet USDC + EURC at faucet.circle.com.
            </div>
          </header>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {provisioned.wallets.map((w) => (
              <li
                key={w.walletId}
                style={{
                  padding: "12px 20px",
                  borderBottom: "1px solid var(--border)",
                  display: "grid",
                  gridTemplateColumns: "100px 1fr auto",
                  gap: 12,
                  alignItems: "center",
                  fontSize: 12.5,
                }}
              >
                <span style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)" }}>{w.refId}</span>
                <a
                  href={explorerAddress(w.address)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    color: "var(--teal-text)",
                    textDecoration: "none",
                    wordBreak: "break-all",
                  }}
                >
                  {w.address}
                </a>
                <a
                  href={ARC_TESTNET_FAUCET}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-brand-outline"
                  style={{ padding: "6px 12px", fontSize: 11.5 }}
                >
                  Fund →
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Banner({ kind, children }: { kind: "ok" | "warn" | "error"; children: React.ReactNode }) {
  const bg = kind === "ok" ? "rgba(1,183,62,0.08)" : kind === "warn" ? "rgba(245,158,11,0.10)" : "rgba(239,68,68,0.08)";
  const color = kind === "ok" ? "var(--teal-text)" : kind === "warn" ? "#b45309" : "#b91c1c";
  return (
    <div
      style={{
        marginTop: 14,
        padding: "10px 14px",
        border: "1px solid",
        borderColor: kind === "ok" ? "rgba(1,183,62,0.32)" : kind === "warn" ? "rgba(245,158,11,0.32)" : "rgba(239,68,68,0.32)",
        background: bg,
        color,
        borderRadius: 0,
        fontSize: 12.5,
        lineHeight: 1.55,
      }}
    >
      {children}
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th
      style={{
        textAlign: align ?? "left",
        padding: "10px 20px",
        fontSize: 11,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--text-muted)",
        fontWeight: 600,
        borderBottom: "1px solid var(--border)",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, mono, align }: { children: React.ReactNode; mono?: boolean; align?: "right" }) {
  return (
    <td
      style={{
        padding: "11px 20px",
        fontSize: 12.5,
        textAlign: align ?? "left",
        color: mono ? "var(--text-secondary)" : "var(--text-primary)",
        fontFamily: mono ? "var(--font-geist-mono)" : undefined,
        borderBottom: "1px solid var(--border)",
        wordBreak: mono ? "break-all" : undefined,
      }}
    >
      {children}
    </td>
  );
}
