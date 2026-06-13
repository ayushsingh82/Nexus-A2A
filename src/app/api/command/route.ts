import { NextResponse } from "next/server";
import { getKpis, listAgents, getPortfolio } from "@/agents/store";

export const dynamic = "force-dynamic";

type CommandIntent =
  | { type: "deploy"; amount: number; protocol: string | "auto" }
  | { type: "withdraw"; amount: number; protocol: string | "all" }
  | { type: "rebalance"; from: string; to: string }
  | { type: "status"; subject: string }
  | { type: "send"; amount: number; to: string }
  | { type: "unknown"; message: string };

function parseIntent(prompt: string): CommandIntent {
  const p = prompt.toLowerCase().trim();

  // Deploy / stake / deposit patterns
  const deployMatch = p.match(/(?:deploy|stake|deposit|put|invest|supply)\s+(\d+(?:\.\d+)?)\s*(?:usdc)?(?:\s+(?:to|on|into)\s+(\w+))?/);
  if (deployMatch) {
    const amount = parseFloat(deployMatch[1]);
    const protocol = deployMatch[2] ?? "auto";
    return { type: "deploy", amount, protocol: mapProtocol(protocol) };
  }

  // Withdraw patterns
  const withdrawMatch = p.match(/(?:withdraw|pull|remove|unstake)\s+(\d+(?:\.\d+)?)\s*(?:usdc)?(?:\s+(?:from)\s+(\w+))?/);
  if (withdrawMatch) {
    const amount = parseFloat(withdrawMatch[1]);
    const protocol = withdrawMatch[2] ?? "all";
    return { type: "withdraw", amount, protocol: mapProtocol(protocol) };
  }

  // Rebalance patterns
  const rebalanceMatch = p.match(/(?:rebalance|move|shift|transfer)\s+(?:from\s+)?(\w+)\s+(?:to\s+)?(\w+)/);
  if (rebalanceMatch) {
    return { type: "rebalance", from: mapProtocol(rebalanceMatch[1]), to: mapProtocol(rebalanceMatch[2]) };
  }

  // Send / pay patterns
  const sendMatch = p.match(/(?:send|pay|transfer)\s+(\d+(?:\.\d+)?)\s*(?:usdc)?\s+to\s+(0x[a-f0-9]+)/i);
  if (sendMatch) {
    return { type: "send", amount: parseFloat(sendMatch[1]), to: sendMatch[2] };
  }

  // Status patterns
  if (p.match(/(?:status|balance|yield|apy|earning|portfolio|how much|what is|show me|check)/)) {
    return { type: "status", subject: "swarm" };
  }

  return { type: "unknown", message: "I couldn't parse that intent. Try: 'Deploy 100 USDC to Aave' or 'Show my yield'." };
}

function mapProtocol(raw: string): string {
  const r = raw.toLowerCase();
  if (r.includes("aave")) return "aave";
  if (r.includes("uni") || r.includes("lp")) return "uniswap-lp";
  if (r.includes("perp") || r.includes("hyper") || r.includes("hl")) return "perp-funding";
  if (r === "auto" || r === "best" || r === "highest" || r === "top") return "auto";
  return r;
}

function buildResponse(intent: CommandIntent) {
  const agents = listAgents();
  const kpis = getKpis();
  const portfolio = getPortfolio();

  switch (intent.type) {
    case "deploy": {
      const targetAgent = intent.protocol === "auto"
        ? agents.filter((a) => a.role !== "master").sort((a, b) => b.currentApyBps - a.currentApyBps)[0]
        : agents.find((a) => a.role === intent.protocol);

      if (!targetAgent) {
        return {
          intent,
          summary: `No agent found for "${intent.protocol}". Available: aave, uniswap-lp, perp-funding.`,
          action: null,
          requiresWallet: true,
        };
      }

      return {
        intent,
        summary: `Deploy ${intent.amount} USDC → ${targetAgent.name} (${(targetAgent.currentApyBps / 100).toFixed(2)}% APY). Gas paid in USDC via 1Shot.`,
        action: {
          type: "deposit",
          protocol: targetAgent.protocol,
          agentId: targetAgent.id,
          agentName: targetAgent.name,
          amountUsdc: intent.amount,
          expectedApyBps: targetAgent.currentApyBps,
          estimatedGasUsdc: 0.01,
        },
        requiresWallet: true,
      };
    }

    case "withdraw": {
      const totalDeployed = portfolio.deployedUsdc;
      return {
        intent,
        summary: `Withdraw ${intent.amount} USDC from ${intent.protocol === "all" ? "all agents" : intent.protocol}. Total deployed: $${totalDeployed.toLocaleString()}.`,
        action: {
          type: "withdraw",
          protocol: intent.protocol,
          amountUsdc: intent.amount,
          estimatedGasUsdc: 0.01,
        },
        requiresWallet: true,
      };
    }

    case "rebalance": {
      return {
        intent,
        summary: `Redelegate capital from ${intent.from} → ${intent.to} via ERC-7710.`,
        action: {
          type: "redelegate",
          from: intent.from,
          to: intent.to,
          estimatedGasUsdc: 0.02,
        },
        requiresWallet: true,
      };
    }

    case "send": {
      return {
        intent,
        summary: `Send ${intent.amount} USDC to ${intent.to} on Base Sepolia. Gas paid in USDC.`,
        action: {
          type: "transfer",
          to: intent.to,
          amountUsdc: intent.amount,
          estimatedGasUsdc: 0.005,
          token: "USDC",
          chain: "base-sepolia",
        },
        requiresWallet: true,
      };
    }

    case "status": {
      const topAgent = agents.filter((a) => a.role !== "master").sort((a, b) => b.currentApyBps - a.currentApyBps)[0];
      return {
        intent,
        summary: `Swarm status: $${(kpis.totalDeployedUsdc / 1000).toFixed(0)}k deployed · ${(kpis.avgApyBps / 100).toFixed(2)}% avg APY · $${kpis.totalYieldUsdc.toFixed(2)} earned. Top performer: ${topAgent?.name ?? "—"} at ${topAgent ? (topAgent.currentApyBps / 100).toFixed(2) : "—"}% APY.`,
        action: null,
        requiresWallet: false,
        data: {
          kpis,
          topAgent: topAgent ? { name: topAgent.name, apyBps: topAgent.currentApyBps, deployedUsdc: topAgent.deployedUsdc } : null,
        },
      };
    }

    default: {
      return {
        intent,
        summary: (intent as { message: string }).message,
        action: null,
        requiresWallet: false,
        suggestions: [
          "Deploy 100 USDC to Aave",
          "Deploy 500 USDC to best yield",
          "Show my portfolio status",
          "Rebalance from Aave to Uniswap",
          "Send 10 USDC to 0x1234…",
        ],
      };
    }
  }
}

export async function POST(request: Request) {
  let prompt = "";
  try {
    const body = (await request.json()) as { prompt?: unknown };
    prompt = typeof body?.prompt === "string" ? body.prompt : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!prompt.trim()) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  const intent = parseIntent(prompt);
  const response = buildResponse(intent);

  return NextResponse.json({ ok: true, prompt, ...response });
}
