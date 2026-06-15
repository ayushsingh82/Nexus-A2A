"use client";

import { useState, useRef, useEffect } from "react";
import { useAccount } from "wagmi";
import { parseUnits, isAddress, encodeFunctionData, createPublicClient, http } from "viem";
import { baseSepolia } from "wagmi/chains";
import { BASE_SEPOLIA_USDC } from "@/lib/wagmi";
import { ERC20_ABI, AAVE_POOL_ABI, AAVE_POOL, UNISWAP_SWAP_ROUTER } from "@/lib/contracts";
import NexusLogo from "@/components/NexusLogo";

/* ── viem public client for receipt polling ──────────────────── */
const rpcClient = createPublicClient({
  chain: baseSepolia,
  transport: http("https://sepolia.base.org"),
});

/* ── window.ethereum helper ──────────────────────────────────── */
type EthReq = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };

function getEth(): EthReq {
  const eth = (window as unknown as { ethereum?: EthReq }).ethereum;
  if (!eth?.request) throw new Error("MetaMask not found in window.ethereum.");
  return eth;
}

async function waitForTx(hash: `0x${string}`): Promise<void> {
  await rpcClient.waitForTransactionReceipt({ hash, confirmations: 1 });
}

/* ── types ───────────────────────────────────────────────────── */
const SUGGESTIONS = [
  "Deploy 2 USDC to Aave",
  "Deploy 1 USDC to best yield",
  "Show my portfolio",
  "Withdraw 1 USDC from Aave",
  "What APY is Aave giving?",
];

type CommandResult = {
  prompt: string;
  summary: string;
  intent: { type: string; [key: string]: unknown };
  action: {
    type: string;
    amountUsdc?: number;
    protocol?: string;
    agentId?: string;
    agentRole?: string;
    agentName?: string;
    expectedApyBps?: number;
    estimatedGasUsdc?: number;
    to?: string;
  } | null;
  requiresWallet: boolean;
  suggestions?: string[];
};

type Message = {
  id: string;
  role: "user" | "swarm";
  text: string;
  result?: CommandResult;
  status?: "pending" | "confirmed" | "error";
  txHash?: string;
  stepText?: string;
};

/* ── component ───────────────────────────────────────────────── */
export default function CommandPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "swarm",
      text: "Nexus-A2A ready. Type a command — the swarm plans the action and calls MetaMask to sign each tx on Base Sepolia.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { isConnected, address } = useAccount();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function setStep(msgId: string, stepText: string) {
    setMessages((m) => m.map((msg) => msg.id === msgId ? { ...msg, stepText } : msg));
  }

  /* ── 1Shot path: wallet_sendCalls (EIP-5792) ─────────────── */
  async function tryVia1Shot(
    msgId: string,
    agentRole: string,
    amount: bigint,
    addr: `0x${string}`
  ): Promise<`0x${string}`> {
    const eth = getEth();
    const chainHex = `0x${(84532).toString(16)}`;

    const calls =
      agentRole === "aave"
        ? [
            { to: BASE_SEPOLIA_USDC, data: encodeFunctionData({ abi: ERC20_ABI, functionName: "approve", args: [AAVE_POOL, amount] }), value: "0x0" },
            { to: AAVE_POOL, data: encodeFunctionData({ abi: AAVE_POOL_ABI, functionName: "supply", args: [BASE_SEPOLIA_USDC, amount, addr, 0] }), value: "0x0" },
          ]
        : [{ to: BASE_SEPOLIA_USDC, data: encodeFunctionData({ abi: ERC20_ABI, functionName: "approve", args: [UNISWAP_SWAP_ROUTER, amount] }), value: "0x0" }];

    // Discover paymaster (3 s timeout — don't block if wallet doesn't support it)
    let capabilities: Record<string, unknown> = {};
    try {
      const caps = await Promise.race([
        eth.request({ method: "wallet_getCapabilities", params: [addr] }),
        new Promise((_, r) => setTimeout(() => r(new Error("caps timeout")), 3000)),
      ]) as Record<string, { paymasterService?: { supported?: boolean; url?: string } }>;
      const ps = caps?.[chainHex]?.paymasterService;
      if (ps?.supported && ps?.url) capabilities = { paymasterService: { url: ps.url } };
    } catch { /* not supported */ }

    setStep(msgId, agentRole === "aave" ? "Confirm Approve + Supply in MetaMask…" : "Confirm in MetaMask…");

    // wallet_sendCalls — 30 s timeout
    const batchId = await Promise.race([
      eth.request({ method: "wallet_sendCalls", params: [{ version: "2.0.0", chainId: chainHex, from: addr, calls, capabilities }] }),
      new Promise<never>((_, r) => setTimeout(() => r(new Error("wallet_sendCalls timeout")), 30_000)),
    ]) as string;

    setStep(msgId, "Waiting for confirmation…");

    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const res = await eth.request({ method: "wallet_getCallsStatus", params: [batchId] }) as {
        status: number;
        receipts?: Array<{ transactionHash: `0x${string}` }>;
      };
      if (res.status === 200) return res.receipts?.at(-1)?.transactionHash ?? (batchId as `0x${string}`);
      if (res.status >= 400) throw new Error(`wallet_sendCalls failed (${res.status})`);
    }
    throw new Error("Transaction timed out");
  }

  /* ── Fallback: direct eth_sendTransaction ────────────────── */
  async function viaDirectTx(
    msgId: string,
    agentRole: string,
    amount: bigint,
    addr: `0x${string}`
  ): Promise<`0x${string}`> {
    const eth = getEth();

    if (agentRole === "aave") {
      setStep(msgId, "Step 1/2 — Approve USDC · confirm in MetaMask…");
      const approveHash = await eth.request({
        method: "eth_sendTransaction",
        params: [{ from: addr, to: BASE_SEPOLIA_USDC, data: encodeFunctionData({ abi: ERC20_ABI, functionName: "approve", args: [AAVE_POOL, amount] }) }],
      }) as `0x${string}`;
      setStep(msgId, "Step 1/2 — Waiting for approval…");
      await waitForTx(approveHash);

      setStep(msgId, "Step 2/2 — Supply to Aave · confirm in MetaMask…");
      const supplyHash = await eth.request({
        method: "eth_sendTransaction",
        params: [{ from: addr, to: AAVE_POOL, data: encodeFunctionData({ abi: AAVE_POOL_ABI, functionName: "supply", args: [BASE_SEPOLIA_USDC, amount, addr, 0] }) }],
      }) as `0x${string}`;
      setStep(msgId, "Step 2/2 — Confirming…");
      await waitForTx(supplyHash);
      return supplyHash;
    }

    setStep(msgId, "Approve USDC · confirm in MetaMask…");
    const hash = await eth.request({
      method: "eth_sendTransaction",
      params: [{ from: addr, to: BASE_SEPOLIA_USDC, data: encodeFunctionData({ abi: ERC20_ABI, functionName: "approve", args: [UNISWAP_SWAP_ROUTER, amount] }) }],
    }) as `0x${string}`;
    setStep(msgId, "Waiting for confirmation…");
    await waitForTx(hash);
    return hash;
  }

  /* ── main execute ────────────────────────────────────────── */
  async function executeAction(msgId: string, action: CommandResult["action"]) {
    if (!action || !isConnected || !address) return;

    setMessages((m) => m.map((msg) => msg.id === msgId ? { ...msg, status: "pending" as const, stepText: "Preparing…" } : msg));

    try {
      let txHash: `0x${string}`;
      const amountUsdc = action.amountUsdc ?? 0;
      const amount = parseUnits(amountUsdc.toString(), 6);
      const agentRole = action.agentRole ?? action.agentId ?? "aave";
      const eth = getEth();

      if (action.type === "deposit") {
        // Try 1Shot (wallet_sendCalls) first; fall back to direct eth_sendTransaction
        try {
          txHash = await tryVia1Shot(msgId, agentRole, amount, address);
        } catch (batchErr) {
          console.info("1Shot not available, using direct tx:", (batchErr as Error).message);
          txHash = await viaDirectTx(msgId, agentRole, amount, address);
        }

      } else if (action.type === "withdraw") {
        setStep(msgId, "Withdraw from Aave · confirm in MetaMask…");
        txHash = await eth.request({
          method: "eth_sendTransaction",
          params: [{ from: address, to: AAVE_POOL, data: encodeFunctionData({ abi: AAVE_POOL_ABI, functionName: "withdraw", args: [BASE_SEPOLIA_USDC, amount, address] }) }],
        }) as `0x${string}`;
        setStep(msgId, "Waiting for confirmation…");
        await waitForTx(txHash);

      } else if (action.type === "transfer" && action.to && isAddress(action.to)) {
        setStep(msgId, "Send USDC · confirm in MetaMask…");
        txHash = await eth.request({
          method: "eth_sendTransaction",
          params: [{ from: address, to: BASE_SEPOLIA_USDC, data: encodeFunctionData({ abi: ERC20_ABI, functionName: "transfer", args: [action.to as `0x${string}`, amount] }) }],
        }) as `0x${string}`;
        setStep(msgId, "Waiting for confirmation…");
        await waitForTx(txHash);

      } else {
        throw new Error(`Unsupported action: ${action.type}`);
      }

      // Record real tx in store → portfolio + history update
      await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: action.agentId ?? agentRole, agentName: action.agentName, protocol: action.protocol, action: action.type, amountUsdc, txHash, apyBps: action.expectedApyBps }),
      });

      setMessages((m) => m.map((msg) => msg.id === msgId ? { ...msg, status: "confirmed" as const, txHash, stepText: undefined } : msg));
    } catch (err) {
      // MetaMask throws plain objects (not Error instances), e.g. { code: 4001, message: "..." }
      const mmErr = err as { code?: number; message?: string };
      if (mmErr?.code === 4001) {
        // User rejected — reset so they can try again
        setMessages((m) => m.map((msg) => msg.id === msgId ? { ...msg, status: undefined, stepText: undefined } : msg));
        return;
      }
      const raw = mmErr?.message ?? (err instanceof Error ? err.message : "Transaction failed.");
      const clean = String(raw).replace(/0x[0-9a-fA-F]{40,}/g, "…").slice(0, 180).trim();
      setMessages((m) => m.map((msg) => msg.id === msgId ? { ...msg, status: "error" as const, text: clean || "Transaction failed.", stepText: undefined } : msg));
    }
  }

  async function sendPrompt(text: string) {
    if (!text.trim() || loading) return;
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/command", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: text }) });
      const data = (await res.json()) as CommandResult;
      // No status here — user must click "Confirm in MetaMask →" to trigger tx
      setMessages((m) => [...m, { id: `s-${Date.now()}`, role: "swarm", text: data.summary, result: data }]);
    } catch {
      setMessages((m) => [...m, { id: `e-${Date.now()}`, role: "swarm", text: "Something went wrong. Try again." }]);
    } finally {
      setLoading(false);
    }
  }

  /* ── render ──────────────────────────────────────────────── */
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - var(--topbar-h))", background: "var(--bg-base)" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} isConnected={isConnected} onExecute={(a) => executeAction(msg.id, a)} />
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <SwarmAvatar />
            <div style={{ padding: "10px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", fontSize: 13, color: "var(--text-muted)" }}>
              <ThinkingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {!loading && (
        <div style={{ padding: "0 28px 12px", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => sendPrompt(s)} style={{ padding: "6px 12px", fontSize: 12, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit" }}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div style={{ borderTop: "1px solid var(--border)", padding: "16px 28px", background: "var(--bg-elevated)" }}>
        {!isConnected && (
          <div style={{ marginBottom: 10, padding: "8px 12px", background: "rgba(0,1,252,0.05)", border: "1px solid rgba(0,1,252,0.15)", fontSize: 12, color: "#0001FC" }}>
            Connect MetaMask — each tx opens a popup. If your Smart Account is active, gas is paid in USDC via 1Shot.
          </div>
        )}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1, border: "1px solid var(--border)", background: "var(--bg-base)", padding: "2px 4px" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendPrompt(input); } }}
              placeholder="Deploy 2 USDC to Aave · Withdraw 1 USDC · Show portfolio · What APY is Aave giving?"
              rows={2}
              style={{ display: "block", width: "100%", resize: "none", border: "none", outline: "none", background: "transparent", fontSize: 13.5, color: "var(--text-primary)", padding: "10px 12px", fontFamily: "inherit", lineHeight: 1.5 }}
            />
          </div>
          <button
            onClick={() => sendPrompt(input)}
            disabled={loading || !input.trim()}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, background: loading || !input.trim() ? "var(--bg-surface)" : "#0001FC", color: loading || !input.trim() ? "var(--text-muted)" : "#fff", border: "none", cursor: loading || !input.trim() ? "not-allowed" : "pointer", flexShrink: 0, fontSize: 16 }}
          >
            ↑
          </button>
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-muted)" }}>
          ↵ send · Shift+↵ newline · Base Sepolia testnet · 1Shot if Smart Account active, else ETH gas
        </div>
      </div>
    </div>
  );
}

/* ── ChatMessage ─────────────────────────────────────────────── */
function ChatMessage({ msg, isConnected, onExecute }: { msg: Message; isConnected: boolean; onExecute: (a: CommandResult["action"]) => void }) {
  if (msg.role === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ maxWidth: 520, padding: "10px 14px", background: "#0001FC", color: "#fff", fontSize: 13.5, lineHeight: 1.5 }}>{msg.text}</div>
      </div>
    );
  }

  const result = msg.result;
  const isPending = msg.status === "pending";
  const isConfirmed = msg.status === "confirmed";
  const isError = msg.status === "error";

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <SwarmAvatar />
      <div style={{ flex: 1, maxWidth: 620 }}>
        <div style={{ padding: "12px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.6 }}>
          {msg.text}
        </div>

        {result?.action && !isConfirmed && (
          <div style={{ marginTop: 8, padding: "14px 16px", background: "var(--bg-surface)", border: "1px solid rgba(0,1,252,0.18)", borderLeft: "3px solid #0001FC" }}>
            <ActionPreview action={result.action} />

            {isError ? (
              <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", fontSize: 12, color: "#dc2626", fontFamily: "monospace" }}>
                {msg.text}
              </div>
            ) : (
              <button
                onClick={() => !isPending && onExecute(result.action)}
                disabled={!isConnected || isPending}
                style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", background: !isConnected ? "var(--bg-base)" : isPending ? "rgba(0,1,252,0.7)" : "#0001FC", color: !isConnected ? "var(--text-muted)" : "#fff", border: !isConnected ? "1px solid var(--border)" : "none", cursor: !isConnected || isPending ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}
              >
                {isPending ? (
                  <><SpinnerIcon /> {msg.stepText ?? "Waiting…"}</>
                ) : !isConnected ? (
                  "Connect MetaMask first"
                ) : (
                  "Confirm in MetaMask →"
                )}
              </button>
            )}
          </div>
        )}

        {isConfirmed && msg.txHash && (
          <div style={{ marginTop: 8, padding: "12px 16px", background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ color: "#16a34a", fontWeight: 700, fontSize: 13 }}>✓ Confirmed on Base Sepolia</span>
            <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-muted)" }}>{msg.txHash.slice(0, 18)}…{msg.txHash.slice(-6)}</span>
            <a href={`https://sepolia.basescan.org/tx/${msg.txHash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#0001FC", marginLeft: "auto", fontWeight: 600 }}>
              View on BaseScan ↗
            </a>
          </div>
        )}

        {result?.suggestions && !result?.action && (
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {result.suggestions.slice(0, 4).map((s) => (
              <button key={s} style={{ padding: "4px 10px", fontSize: 11.5, background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit" }}>{s}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── ActionPreview ───────────────────────────────────────────── */
function ActionPreview({ action }: { action: NonNullable<CommandResult["action"]> }) {
  const agentRole = action.agentRole ?? action.agentId ?? "";
  const rows: [string, string][] = [];

  if (action.type === "deposit") {
    rows.push(["Action", "Deposit USDC"]);
    if (action.agentName) rows.push(["Agent", action.agentName]);
    if (action.amountUsdc) rows.push(["Amount", `$${action.amountUsdc} USDC`]);
    if (action.expectedApyBps) rows.push(["Expected APY", `${(action.expectedApyBps / 100).toFixed(2)}%`]);
    rows.push(["Steps", agentRole === "aave" ? "2 MetaMask popups: Approve USDC → Supply to Aave" : "1 MetaMask popup: Approve USDC"]);
    rows.push(["Gas", "USDC via 1Shot if Smart Account active · else ETH"]);
  } else if (action.type === "withdraw") {
    rows.push(["Action", "Withdraw from Aave"]);
    if (action.amountUsdc) rows.push(["Amount", `$${action.amountUsdc} USDC`]);
    rows.push(["Steps", "1 MetaMask popup"]);
  } else if (action.type === "transfer") {
    rows.push(["Action", "Send USDC"]);
    if (action.to) rows.push(["To", `${action.to.slice(0, 10)}…${action.to.slice(-4)}`]);
    if (action.amountUsdc) rows.push(["Amount", `$${action.amountUsdc} USDC`]);
    rows.push(["Steps", "1 MetaMask popup"]);
  }
  rows.push(["Chain", "Base Sepolia (testnet · chain 84532)"]);

  return (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>Planned Action</div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "6px 0", fontSize: 12, color: "var(--text-muted)", width: 120, verticalAlign: "top" }}>{k}</td>
              <td style={{ padding: "6px 0", fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)" }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SwarmAvatar() {
  return <div style={{ flexShrink: 0, marginTop: 2 }}><NexusLogo size={30} variant="default" /></div>;
}

function ThinkingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-muted)", display: "inline-block", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.85)}50%{opacity:1;transform:scale(1)}}`}</style>
    </span>
  );
}

function SpinnerIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.8s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </svg>
  );
}
