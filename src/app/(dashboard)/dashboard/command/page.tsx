"use client";

import { useState, useRef, useEffect } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { parseUnits, isAddress, encodeFunctionData } from "viem";
import { wagmiConfig, BASE_SEPOLIA_USDC } from "@/lib/wagmi";
import { ERC20_ABI, AAVE_POOL_ABI, AAVE_POOL, UNISWAP_SWAP_ROUTER } from "@/lib/contracts";
import NexusLogo from "@/components/NexusLogo";

const SUGGESTIONS = [
  "Deploy 5 USDC to Aave",
  "Deploy 5 USDC to best yield",
  "Show my portfolio status",
  "Rebalance from Aave to Uniswap",
  "Withdraw 2 USDC from Aave",
];

type Eth = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };

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
  data?: unknown;
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

export default function CommandPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "swarm",
      text: "Agent swarm ready. Commands go via MetaMask Flask — gas is paid in USDC using 1Shot (EIP-5792 batch + paymaster).",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { isConnected, address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function setStep(msgId: string, stepText: string) {
    setMessages((m) =>
      m.map((msg) => msg.id === msgId ? { ...msg, stepText } : msg)
    );
  }

  /* ── wallet_sendCalls (EIP-5792) — 1Shot path ─────────────── */
  async function sendVia1Shot(
    msgId: string,
    agentRole: string,
    amount: bigint,
    addr: `0x${string}`
  ): Promise<`0x${string}`> {
    const eth = (window as unknown as { ethereum?: Eth }).ethereum;
    if (!eth?.request) throw new Error("MetaMask Flask not detected in window.ethereum");

    const calls =
      agentRole === "aave"
        ? [
            {
              to: BASE_SEPOLIA_USDC,
              data: encodeFunctionData({ abi: ERC20_ABI, functionName: "approve", args: [AAVE_POOL, amount] }),
              value: "0x0",
            },
            {
              to: AAVE_POOL,
              data: encodeFunctionData({ abi: AAVE_POOL_ABI, functionName: "supply", args: [BASE_SEPOLIA_USDC, amount, addr, 0] }),
              value: "0x0",
            },
          ]
        : [
            {
              to: BASE_SEPOLIA_USDC,
              data: encodeFunctionData({ abi: ERC20_ABI, functionName: "approve", args: [UNISWAP_SWAP_ROUTER, amount] }),
              value: "0x0",
            },
          ];

    // Discover paymaster capabilities (USDC gas via 1Shot)
    let capabilities: Record<string, unknown> = {};
    try {
      const caps = await eth.request({ method: "wallet_getCapabilities", params: [addr] }) as Record<string, { paymasterService?: { supported?: boolean; url?: string } }>;
      const ps = caps?.[`0x${(84532).toString(16)}`]?.paymasterService;
      if (ps?.supported && ps?.url) capabilities = { paymasterService: { url: ps.url } };
    } catch { /* wallet doesn't support getCapabilities */ }

    setStep(msgId,
      agentRole === "aave"
        ? "Confirm Approve + Supply in MetaMask Flask…"
        : "Confirm Approve in MetaMask Flask…"
    );

    const batchId = await eth.request({
      method: "wallet_sendCalls",
      params: [{
        version: "2.0.0",
        chainId: `0x${(84532).toString(16)}`,
        from: addr,
        calls,
        capabilities,
      }],
    }) as string;

    setStep(msgId, "Waiting for on-chain confirmation…");

    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const res = await eth.request({ method: "wallet_getCallsStatus", params: [batchId] }) as {
        status: number;
        receipts?: Array<{ transactionHash: `0x${string}` }>;
      };
      if (res.status === 200) {
        return res.receipts?.at(-1)?.transactionHash ?? (`0x${batchId}` as `0x${string}`);
      }
      if (res.status >= 400) throw new Error(`Batch failed (status ${res.status})`);
    }
    throw new Error("Transaction timed out after 120s");
  }

  /* ── fallback: individual writeContractAsync ───────────────── */
  async function fallbackDeposit(
    msgId: string,
    agentRole: string,
    amount: bigint,
    addr: `0x${string}`
  ): Promise<`0x${string}`> {
    if (agentRole === "aave") {
      setStep(msgId, "Step 1/2 — Approve USDC in MetaMask Flask…");
      const approveTx = await writeContractAsync({
        address: BASE_SEPOLIA_USDC,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [AAVE_POOL, amount],
      });
      setStep(msgId, "Step 1/2 — Waiting for approval…");
      await waitForTransactionReceipt(wagmiConfig, { hash: approveTx, confirmations: 1 });
      setStep(msgId, "Step 2/2 — Supply to Aave in MetaMask Flask…");
      const supplyTx = await writeContractAsync({
        address: AAVE_POOL,
        abi: AAVE_POOL_ABI,
        functionName: "supply",
        args: [BASE_SEPOLIA_USDC, amount, addr, 0],
      });
      setStep(msgId, "Step 2/2 — Waiting for supply confirmation…");
      await waitForTransactionReceipt(wagmiConfig, { hash: supplyTx, confirmations: 1 });
      return supplyTx;
    }
    setStep(msgId, "Approve USDC in MetaMask Flask…");
    const tx = await writeContractAsync({
      address: BASE_SEPOLIA_USDC,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [UNISWAP_SWAP_ROUTER, amount],
    });
    await waitForTransactionReceipt(wagmiConfig, { hash: tx, confirmations: 1 });
    return tx;
  }

  /* ── main execute ──────────────────────────────────────────── */
  async function executeAction(msgId: string, action: CommandResult["action"]) {
    if (!action || !isConnected || !address) return;

    setMessages((m) =>
      m.map((msg) => msg.id === msgId ? { ...msg, status: "pending" as const, stepText: "Preparing…" } : msg)
    );

    try {
      let txHash: `0x${string}`;
      const amountUsdc = action.amountUsdc ?? 0;
      const amount = parseUnits(amountUsdc.toString(), 6);
      const agentRole = action.agentRole ?? action.agentId ?? "aave";

      if (action.type === "deposit") {
        try {
          // Primary path: wallet_sendCalls via 1Shot (single popup, USDC gas)
          txHash = await sendVia1Shot(msgId, agentRole, amount, address);
        } catch {
          // Fallback: individual approve + action
          txHash = await fallbackDeposit(msgId, agentRole, amount, address);
        }
      } else if (action.type === "withdraw") {
        setStep(msgId, "Confirm withdrawal in MetaMask Flask…");
        txHash = await writeContractAsync({
          address: AAVE_POOL,
          abi: AAVE_POOL_ABI,
          functionName: "withdraw",
          args: [BASE_SEPOLIA_USDC, amount, address],
        });
        await waitForTransactionReceipt(wagmiConfig, { hash: txHash, confirmations: 1 });
      } else if (action.type === "transfer" && action.to && isAddress(action.to)) {
        setStep(msgId, "Confirm USDC send in MetaMask Flask…");
        txHash = await writeContractAsync({
          address: BASE_SEPOLIA_USDC,
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [action.to as `0x${string}`, amount],
        });
        await waitForTransactionReceipt(wagmiConfig, { hash: txHash, confirmations: 1 });
      } else {
        setStep(msgId, "Confirm in MetaMask Flask…");
        txHash = await writeContractAsync({
          address: BASE_SEPOLIA_USDC,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [UNISWAP_SWAP_ROUTER, amount],
        });
        await waitForTransactionReceipt(wagmiConfig, { hash: txHash, confirmations: 1 });
      }

      await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: action.agentId ?? agentRole,
          agentName: action.agentName,
          protocol: action.protocol,
          action: action.type,
          amountUsdc,
          txHash,
          apyBps: action.expectedApyBps,
        }),
      });

      setMessages((m) =>
        m.map((msg) =>
          msg.id === msgId ? { ...msg, status: "confirmed" as const, txHash, stepText: undefined } : msg
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message.slice(0, 140) : "Transaction failed.";
      setMessages((m) =>
        m.map((msg) =>
          msg.id === msgId ? { ...msg, status: "error" as const, text: message, stepText: undefined } : msg
        )
      );
    }
  }

  async function sendPrompt(text: string) {
    if (!text.trim() || loading) return;
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const data = (await res.json()) as CommandResult;
      setMessages((m) => [
        ...m,
        { id: `s-${Date.now()}`, role: "swarm", text: data.summary, result: data, status: data.action ? "pending" : undefined },
      ]);
    } catch {
      setMessages((m) => [...m, { id: `e-${Date.now()}`, role: "swarm", text: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - var(--topbar-h))", background: "var(--bg-base)" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            msg={msg}
            isConnected={isConnected}
            onExecute={(action) => executeAction(msg.id, action)}
          />
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

      {messages.length <= 2 && !loading && (
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
            Connect MetaMask Flask — transactions use EIP-5792 batch + 1Shot paymaster (gas in USDC, no ETH needed).
          </div>
        )}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1, border: "1px solid var(--border)", background: "var(--bg-base)", padding: "2px 4px" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendPrompt(input); } }}
              placeholder="Deploy 5 USDC to Aave · Send 2 USDC to 0x… · Show portfolio"
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
          ↵ to send · Shift+↵ newline · EIP-5792 batch via MetaMask Flask · gas in USDC via 1Shot
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ msg, isConnected, onExecute }: {
  msg: Message;
  isConnected: boolean;
  onExecute: (action: CommandResult["action"]) => void;
}) {
  if (msg.role === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ maxWidth: 520, padding: "10px 14px", background: "#0001FC", color: "#fff", fontSize: 13.5, lineHeight: 1.5 }}>
          {msg.text}
        </div>
      </div>
    );
  }

  const result = msg.result;

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <SwarmAvatar />
      <div style={{ flex: 1, maxWidth: 600 }}>
        <div style={{ padding: "12px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.6 }}>
          {msg.text}
        </div>

        {result?.action && msg.status !== "confirmed" && (
          <div style={{ marginTop: 8, padding: "14px 16px", background: "var(--bg-surface)", border: "1px solid rgba(0,1,252,0.18)", borderLeft: "3px solid #0001FC" }}>
            <ActionPreview action={result.action} />
            {msg.status === "error" ? (
              <div style={{ marginTop: 10, fontSize: 12, color: "#dc2626" }}>
                Error: {msg.text}
              </div>
            ) : (
              <button
                onClick={() => onExecute(result.action)}
                disabled={!isConnected || msg.status === "pending"}
                style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 16px", background: !isConnected ? "var(--bg-base)" : "#0001FC", color: !isConnected ? "var(--text-muted)" : "#fff", border: !isConnected ? "1px solid var(--border)" : "none", cursor: !isConnected || msg.status === "pending" ? "not-allowed" : "pointer", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", opacity: msg.status === "pending" ? 0.85 : 1 }}
              >
                {msg.status === "pending" ? (
                  <><SpinnerIcon /> {msg.stepText ?? "Submitting…"}</>
                ) : !isConnected ? (
                  "Connect MetaMask Flask to confirm"
                ) : (
                  <>Confirm in MetaMask Flask →</>
                )}
              </button>
            )}
          </div>
        )}

        {msg.status === "confirmed" && msg.txHash && (
          <div style={{ marginTop: 8, padding: "12px 16px", background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ color: "#16a34a", fontWeight: 700, fontSize: 13 }}>✓ Confirmed on Base Sepolia</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
              {msg.txHash.slice(0, 18)}…{msg.txHash.slice(-6)}
            </span>
            <a
              href={`https://sepolia.basescan.org/tx/${msg.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: "#0001FC", marginLeft: "auto", fontWeight: 600 }}
            >
              View on BaseScan ↗
            </a>
          </div>
        )}

        {result?.suggestions && (
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {result.suggestions.slice(0, 4).map((s) => (
              <button key={s} style={{ padding: "4px 10px", fontSize: 11.5, background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit" }}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionPreview({ action }: { action: NonNullable<CommandResult["action"]> }) {
  const rows: [string, string][] = [];

  if (action.type === "deposit") {
    rows.push(["Action", "Deposit USDC"]);
    if (action.agentName) rows.push(["Agent", action.agentName]);
    if (action.amountUsdc) rows.push(["Amount", `$${action.amountUsdc} USDC`]);
    if (action.expectedApyBps) rows.push(["Expected APY", `${(action.expectedApyBps / 100).toFixed(2)}%`]);
    const role = action.agentRole ?? action.agentId ?? "";
    if (role === "aave") rows.push(["Steps", "Approve USDC → Supply to Aave Pool (1 Flask popup)"]);
    else rows.push(["Steps", "Approve USDC (1 Flask popup)"]);
  } else if (action.type === "withdraw") {
    rows.push(["Action", "Withdraw USDC"]);
    if (action.protocol) rows.push(["From", action.protocol]);
    if (action.amountUsdc) rows.push(["Amount", `$${action.amountUsdc} USDC`]);
  } else if (action.type === "redelegate") {
    rows.push(["Action", "ERC-7710 Redelegate"]);
    if (action.protocol) rows.push(["Route", String(action.protocol)]);
  } else if (action.type === "transfer") {
    rows.push(["Action", "USDC Transfer"]);
    if (action.to) rows.push(["To", `${action.to.slice(0, 10)}…${action.to.slice(-4)}`]);
    if (action.amountUsdc) rows.push(["Amount", `$${action.amountUsdc} USDC`]);
  }

  if (action.estimatedGasUsdc !== undefined) {
    rows.push(["Est. gas", `~$${action.estimatedGasUsdc} USDC via 1Shot`]);
  }

  return (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
        Planned Action
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "6px 0", fontSize: 12, color: "var(--text-muted)", width: 130 }}>{k}</td>
              <td style={{ padding: "6px 0", fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SwarmAvatar() {
  return (
    <div style={{ flexShrink: 0, marginTop: 2 }}>
      <NexusLogo size={30} variant="default" />
    </div>
  );
}

function ThinkingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-muted)", display: "inline-block", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.85)} 50%{opacity:1;transform:scale(1)} }`}</style>
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
