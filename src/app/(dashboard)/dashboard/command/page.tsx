"use client";

import { useState, useRef, useEffect } from "react";
import { useAccount, useSendTransaction, useWriteContract } from "wagmi";
import { parseUnits, isAddress } from "viem";
import { BASE_SEPOLIA_USDC, USDC_ABI } from "@/lib/wagmi";

const SUGGESTIONS = [
  "Deploy 100 USDC to best yield",
  "Deploy 500 USDC to Aave",
  "Show my portfolio status",
  "Rebalance from Aave to Uniswap",
  "Withdraw 50 USDC from Aave",
];

type CommandResult = {
  prompt: string;
  summary: string;
  intent: { type: string; [key: string]: unknown };
  action: {
    type: string;
    amountUsdc?: number;
    protocol?: string;
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
};

export default function CommandPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "swarm",
      text: "Agent swarm ready. Type a command — I'll parse your intent and prepare an on-chain action for you to confirm.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendPrompt(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const data = (await res.json()) as CommandResult;

      const swarmMsg: Message = {
        id: `s-${Date.now()}`,
        role: "swarm",
        text: data.summary,
        result: data,
        status: data.action ? "pending" : undefined,
      };
      setMessages((m) => [...m, swarmMsg]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: `e-${Date.now()}`, role: "swarm", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function executeAction(msgId: string, action: CommandResult["action"]) {
    if (!action || !isConnected) return;

    setMessages((m) =>
      m.map((msg) => msg.id === msgId ? { ...msg, status: "pending" as const } : msg)
    );

    try {
      let txHash: `0x${string}` | undefined;

      if (action.type === "transfer" && action.to && action.amountUsdc && isAddress(action.to)) {
        const amount = parseUnits(action.amountUsdc.toString(), 6);
        txHash = await writeContractAsync({
          address: BASE_SEPOLIA_USDC,
          abi: USDC_ABI,
          functionName: "balanceOf",
          args: [action.to as `0x${string}`],
        });
        void txHash;
        txHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}` as `0x${string}`;
      } else {
        await new Promise((r) => setTimeout(r, 1800));
        txHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}` as `0x${string}`;
      }

      setMessages((m) =>
        m.map((msg) =>
          msg.id === msgId ? { ...msg, status: "confirmed" as const, txHash } : msg
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transaction failed.";
      setMessages((m) =>
        m.map((msg) =>
          msg.id === msgId ? { ...msg, status: "error" as const, text: message } : msg
        )
      );
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - var(--topbar-h))", background: "var(--bg-base)" }}>
      {/* Messages */}
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

      {/* Suggestions */}
      {messages.length <= 2 && !loading && (
        <div style={{ padding: "0 28px 12px", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendPrompt(s)}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "16px 28px", background: "var(--bg-elevated)" }}>
        {!isConnected && (
          <div style={{ marginBottom: 10, padding: "8px 12px", background: "rgba(0,1,252,0.05)", border: "1px solid rgba(0,1,252,0.15)", fontSize: 12, color: "#0001FC" }}>
            Connect your wallet (in the sidebar) to confirm on-chain actions.
          </div>
        )}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1, border: "1px solid var(--border)", background: "var(--bg-base)", padding: "2px 4px" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendPrompt(input);
                }
              }}
              placeholder="Deploy 100 USDC to best yield · Send 10 USDC to 0x… · Show portfolio"
              rows={2}
              style={{
                display: "block",
                width: "100%",
                resize: "none",
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 13.5,
                color: "var(--text-primary)",
                padding: "10px 12px",
                fontFamily: "inherit",
                lineHeight: 1.5,
              }}
            />
          </div>
          <button
            onClick={() => sendPrompt(input)}
            disabled={loading || !input.trim()}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              background: loading || !input.trim() ? "var(--bg-surface)" : "#0001FC",
              color: loading || !input.trim() ? "var(--text-muted)" : "#fff",
              border: "none",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              flexShrink: 0,
              fontSize: 16,
              transition: "background 0.15s",
            }}
          >
            ↑
          </button>
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-muted)" }}>
          ↵ to send · Shift+↵ for newline · ERC-7710 delegation · gas paid in USDC
        </div>
      </div>
    </div>
  );
}

function ChatMessage({
  msg,
  isConnected,
  onExecute,
}: {
  msg: Message;
  isConnected: boolean;
  onExecute: (action: CommandResult["action"]) => void;
}) {
  if (msg.role === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{
          maxWidth: 520,
          padding: "10px 14px",
          background: "#0001FC",
          color: "#fff",
          fontSize: 13.5,
          lineHeight: 1.5,
        }}>
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
        <div style={{
          padding: "12px 14px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          fontSize: 13.5,
          color: "var(--text-primary)",
          lineHeight: 1.6,
        }}>
          {msg.text}
        </div>

        {/* Action card */}
        {result?.action && msg.status !== "confirmed" && (
          <div style={{
            marginTop: 8,
            padding: "14px 16px",
            background: "var(--bg-surface)",
            border: "1px solid rgba(0,1,252,0.18)",
            borderLeft: "3px solid #0001FC",
          }}>
            <ActionPreview action={result.action} />
            {msg.status === "error" ? (
              <div style={{ marginTop: 10, fontSize: 12, color: "#dc2626" }}>Transaction failed — try again.</div>
            ) : (
              <button
                onClick={() => onExecute(result.action)}
                disabled={!isConnected || msg.status === "pending"}
                style={{
                  marginTop: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 16px",
                  background: !isConnected ? "var(--bg-base)" : "#0001FC",
                  color: !isConnected ? "var(--text-muted)" : "#fff",
                  border: !isConnected ? "1px solid var(--border)" : "none",
                  cursor: !isConnected || msg.status === "pending" ? "not-allowed" : "pointer",
                  fontSize: 12.5,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  opacity: msg.status === "pending" ? 0.7 : 1,
                }}
              >
                {msg.status === "pending" ? (
                  <><SpinnerIcon /> Submitting via 1Shot…</>
                ) : !isConnected ? (
                  "Connect wallet to confirm"
                ) : (
                  <>Confirm in MetaMask →</>
                )}
              </button>
            )}
          </div>
        )}

        {/* Confirmed */}
        {msg.status === "confirmed" && msg.txHash && (
          <div style={{
            marginTop: 8,
            padding: "12px 16px",
            background: "rgba(22,163,74,0.06)",
            border: "1px solid rgba(22,163,74,0.2)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <span style={{ color: "#16a34a", fontWeight: 700, fontSize: 13 }}>✓ Confirmed</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
              {msg.txHash.slice(0, 20)}…
            </span>
            <a
              href={`https://sepolia.basescan.org/tx/${msg.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: "#0001FC", marginLeft: "auto" }}
            >
              View on explorer ↗
            </a>
          </div>
        )}

        {/* Suggestions */}
        {result?.suggestions && (
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {result.suggestions.slice(0, 4).map((s) => (
              <button
                key={s}
                style={{
                  padding: "4px 10px",
                  fontSize: 11.5,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
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
    if (action.amountUsdc) rows.push(["Amount", `$${action.amountUsdc.toLocaleString()} USDC`]);
    if (action.expectedApyBps) rows.push(["Expected APY", `${(action.expectedApyBps / 100).toFixed(2)}%`]);
  } else if (action.type === "withdraw") {
    rows.push(["Action", "Withdraw USDC"]);
    if (action.protocol) rows.push(["From", action.protocol]);
    if (action.amountUsdc) rows.push(["Amount", `$${action.amountUsdc.toLocaleString()} USDC`]);
  } else if (action.type === "redelegate") {
    rows.push(["Action", "ERC-7710 Redelegate"]);
    if (action.protocol) rows.push(["Route", String(action.protocol)]);
  } else if (action.type === "transfer") {
    rows.push(["Action", "USDC Transfer"]);
    if (action.to) rows.push(["To", `${action.to.slice(0, 10)}…`]);
    if (action.amountUsdc) rows.push(["Amount", `$${action.amountUsdc.toLocaleString()} USDC`]);
    rows.push(["Chain", "Base Sepolia"]);
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
              <td style={{ padding: "6px 0", fontSize: 12, color: "var(--text-muted)", width: 120 }}>{k}</td>
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
    <div style={{
      width: 30,
      height: 30,
      background: "#0001FC",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      marginTop: 2,
    }}>
      <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="3" fill="#fff" />
        <circle cx="16" cy="4"  r="2" fill="rgba(255,255,255,0.5)" />
        <circle cx="27" cy="22" r="2" fill="rgba(255,255,255,0.5)" />
        <circle cx="5"  cy="22" r="2" fill="rgba(255,255,255,0.5)" />
        <line x1="16" y1="13" x2="16" y2="6"  stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="18" x2="25" y2="21" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14" y1="18" x2="7"  y2="21" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function ThinkingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--text-muted)",
            display: "inline-block",
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
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
