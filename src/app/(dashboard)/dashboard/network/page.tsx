import {
  ARC_TESTNET_CHAIN_ID,
  ARC_TESTNET_CONTRACTS,
  ARC_TESTNET_CURRENCY_SYMBOL,
  ARC_TESTNET_EXPLORER,
  ARC_TESTNET_FAUCET,
  ARC_TESTNET_GAS_TRACKER,
  ARC_TESTNET_RPC,
} from "@/lib/arc";

export const dynamic = "force-dynamic";

const RPCS: Array<{ name: string; http: string; ws: string | null }> = [
  { name: "Primary (Circle)", http: ARC_TESTNET_RPC.primary.http, ws: ARC_TESTNET_RPC.primary.ws },
  { name: "Blockdaemon",      http: ARC_TESTNET_RPC.blockdaemon.http, ws: ARC_TESTNET_RPC.blockdaemon.ws },
  { name: "dRPC",             http: ARC_TESTNET_RPC.drpc.http,        ws: ARC_TESTNET_RPC.drpc.ws },
  { name: "QuickNode",        http: ARC_TESTNET_RPC.quicknode.http,   ws: ARC_TESTNET_RPC.quicknode.ws },
];

const CONTRACTS: Array<{ key: string; label: string; note: string }> = [
  { key: "usdc", label: "USDC (native gas + ERC-20)", note: "Optional ERC-20 interface for the native USDC balance. 6 decimals on ERC-20 calls, 18 for native gas." },
  { key: "eurc", label: "EURC", note: "EURO-pegged stablecoin." },
  { key: "usyc", label: "USYC", note: "Yield-bearing stablecoin for idle treasury parking." },
  { key: "cctpTokenMessenger", label: "CCTP · TokenMessenger", note: "Native USDC bridge entrypoint." },
  { key: "gateway", label: "Circle Gateway", note: "Unified balance + sub-500ms cross-chain transfer." },
  { key: "stableFx", label: "StableFX router", note: "USDC ↔ EURC / USDC ↔ USYC." },
  { key: "paymaster", label: "ERC-7677 Paymaster", note: "All gas paid in USDC." },
  { key: "memo", label: "Memo extension", note: "Attach memo data to transactions." },
  { key: "multicall3From", label: "Multicall3From", note: "Multicall with original-sender semantics." },
  { key: "create2Factory", label: "CREATE2 factory", note: "Deterministic deploys, same address on every chain." },
  { key: "multicall3", label: "Multicall3", note: "Canonical Ethereum multicall." },
  { key: "permit2", label: "Permit2", note: "Uniswap canonical token approvals." },
];

export default function NetworkPage() {
  return (
    <div className="page-content">
      <section className="card" style={{ padding: 24 }}>
        <div className="section-title">Arc Testnet</div>
        <p style={{ marginTop: 6, fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.55 }}>
          Argo settles every captured arb on Arc — Circle&apos;s purpose-built L1. Sub-second
          deterministic finality, ~$0.01 fees in USDC, native USDC as the gas token.
          The values below are the canonical Arc Testnet identifiers.
        </p>

        <div
          style={{
            marginTop: 22,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <ParamTile label="Chain ID" value={ARC_TESTNET_CHAIN_ID.toString()} />
          <ParamTile label="Currency" value={ARC_TESTNET_CURRENCY_SYMBOL} />
          <ParamTile label="Block explorer" value={ARC_TESTNET_EXPLORER} href={ARC_TESTNET_EXPLORER} />
          <ParamTile label="Gas tracker" value={ARC_TESTNET_GAS_TRACKER} href={ARC_TESTNET_GAS_TRACKER} />
          <ParamTile label="Faucet" value={ARC_TESTNET_FAUCET} href={ARC_TESTNET_FAUCET} />
        </div>
      </section>

      <section className="card" style={{ padding: 0, marginTop: 16, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div className="section-title">RPC endpoints</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            All four providers serve the same Arc Testnet. Primary (Circle) is recommended for new builds.
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-surface)" }}>
              <Th>Provider</Th>
              <Th>HTTP</Th>
              <Th>WebSocket</Th>
            </tr>
          </thead>
          <tbody>
            {RPCS.map((r) => (
              <tr key={r.name}>
                <Td>{r.name}</Td>
                <Td mono>{r.http}</Td>
                <Td mono>{r.ws ?? "—"}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card" style={{ padding: 0, marginTop: 16, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div className="section-title">Contract addresses</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            From Circle&apos;s Arc docs. All values are Arc Testnet — mainnet not yet available.
          </div>
        </div>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {CONTRACTS.map((c) => {
            const addr = (ARC_TESTNET_CONTRACTS as Record<string, string>)[c.key];
            return (
              <li
                key={c.key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.1fr 1.3fr 1.6fr",
                  gap: 12,
                  alignItems: "center",
                  padding: "12px 20px",
                  borderBottom: "1px solid var(--border)",
                  fontSize: 12.5,
                }}
              >
                <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{c.label}</div>
                <a
                  href={`${ARC_TESTNET_EXPLORER}/address/${addr}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: 12,
                    color: "var(--teal-text)",
                    textDecoration: "none",
                    wordBreak: "break-all",
                  }}
                >
                  {addr}
                </a>
                <div style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.55 }}>
                  {c.note}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        className="card"
        style={{ padding: 24, marginTop: 16, background: "rgba(1, 183, 62, 0.04)" }}
      >
        <div className="section-title">Get testnet USDC</div>
        <p style={{ marginTop: 6, fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.55 }}>
          Provision Argo&apos;s Circle Wallets from the{" "}
          <a href="/dashboard/wallets" style={{ color: "var(--teal-text)" }}>Wallets page</a>,
          copy each address, and request USDC at{" "}
          <a href={ARC_TESTNET_FAUCET} target="_blank" rel="noreferrer" style={{ color: "var(--teal-text)" }}>
            faucet.circle.com
          </a>
          . USDC is the gas token on Arc, so funding once covers both gas and working capital.
        </p>
      </section>
    </div>
  );
}

function ParamTile({ label, value, href }: { label: string; value: string; href?: string }) {
  const inner = (
    <>
      <div className="kpi-label" style={{ fontSize: 10.5 }}>{label}</div>
      <div
        style={{
          marginTop: 6,
          fontFamily: "var(--font-geist-mono)",
          fontSize: 14,
          fontWeight: 600,
          color: href ? "var(--teal-text)" : "var(--text-primary)",
          wordBreak: "break-all",
          lineHeight: 1.3,
        }}
      >
        {value}
      </div>
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "block",
          padding: "14px 16px",
          border: "1px solid var(--border)",
          borderRadius: 10,
          background: "var(--bg-elevated)",
          textDecoration: "none",
        }}
      >
        {inner}
      </a>
    );
  }
  return (
    <div
      style={{
        padding: "14px 16px",
        border: "1px solid var(--border)",
        borderRadius: 10,
        background: "var(--bg-elevated)",
      }}
    >
      {inner}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: "left",
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

function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td
      style={{
        padding: "11px 20px",
        fontSize: 12.5,
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
