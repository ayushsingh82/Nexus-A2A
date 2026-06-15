import { NextResponse } from "next/server";
import { answerSwarm, type AskAnswer } from "@/graph/ask";
import { getKpis, getPortfolio, listAgents, listDelegations, listExecutions } from "@/agents/store";

export const dynamic = "force-dynamic";

async function askClaude(question: string): Promise<AskAnswer | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const kpis = getKpis();
  const portfolio = getPortfolio();
  const agents = listAgents().filter((a) => a.role !== "master");
  const delegations = listDelegations();
  const executions = listExecutions(5);

  const context = `
You are the Nexus-A2A agent swarm AI. Answer questions about the swarm's live state.

CURRENT SWARM STATE:
- Total deployed: $${kpis.totalDeployedUsdc.toLocaleString()} USDC
- Average APY: ${(kpis.avgApyBps / 100).toFixed(2)}%
- Total yield earned: $${kpis.totalYieldUsdc.toFixed(2)} USDC
- ERC-7715 cap: $${portfolio.totalUsdc.toLocaleString()} USDC
- Idle capital: $${portfolio.idleUsdc.toLocaleString()} USDC
- Weekly yield estimate: $${portfolio.weeklyYieldUsdc.toFixed(2)} USDC

AGENTS:
${agents.map((a) => `- ${a.name} (${a.role}): ${(a.currentApyBps / 100).toFixed(2)}% APY · $${a.deployedUsdc.toLocaleString()} deployed · +$${a.earnedUsdc.toFixed(2)} earned · protocol: ${a.protocol}`).join("\n")}

ACTIVE DELEGATIONS (ERC-7710):
${delegations.filter((d) => d.status === "active").map((d) => `- To: ${d.to} · Cap: $${d.capUsdc.toLocaleString()} · Used: $${d.usedUsdc.toLocaleString()} · ${d.status}`).join("\n")}

RECENT EXECUTIONS:
${executions.map((e) => `- ${e.agentName}: ${e.action} $${e.amountUsdc} USDC at ${(e.apyBps / 100).toFixed(2)}% APY (${new Date(e.atMs).toLocaleTimeString()})${e.txHash ? ` tx:${e.txHash.slice(0, 12)}` : ""}`).join("\n")}

ARCHITECTURE:
- ERC-7715: User grants one permission to the Master Orchestrator
- ERC-7710: Master subdelegates to sub-agents with capped permissions
- Gas: paid in USDC via 1Shot relayer (EIP-5792 batch) — no ETH needed
- Chain: Base Sepolia (testnet, chain 84532)
- USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e

Answer questions clearly, grounded in the above numbers. Be concise. If you don't know something or the data shows 0, say so honestly.
`.trim();

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system: context,
        messages: [{ role: "user", content: question }],
      }),
    });

    if (!res.ok) return null;

    const data = await res.json() as { content: Array<{ type: string; text: string }> };
    const text = data.content.find((c) => c.type === "text")?.text ?? "";
    if (!text) return null;

    // Parse the Claude response into AskAnswer format
    const lines = text.split("\n").filter((l) => l.trim());
    const thesis = lines[0] ?? text.slice(0, 200);
    const points = lines.slice(1).filter((l) => l.trim().length > 10).slice(0, 4);

    return {
      question,
      thesis,
      points,
      evidence: [
        { label: "deployed", value: `$${kpis.totalDeployedUsdc.toLocaleString()}` },
        { label: "avg APY", value: `${(kpis.avgApyBps / 100).toFixed(2)}%` },
        { label: "yield earned", value: `$${kpis.totalYieldUsdc.toFixed(2)}` },
      ],
      related: ["Which agent has the best APY?", "How is my USDC allocated?", "What has been earned so far?"],
      asOfMs: Date.now(),
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let question = "";
  try {
    const body = (await request.json()) as { question?: unknown };
    question = typeof body?.question === "string" ? body.question : "";
  } catch { /* empty */ }

  if (!question.trim()) {
    return NextResponse.json({ error: "Ask a question." }, { status: 400 });
  }

  const aiAnswer = await askClaude(question);
  const answer = aiAnswer ?? answerSwarm(question);

  return NextResponse.json({ answer });
}
