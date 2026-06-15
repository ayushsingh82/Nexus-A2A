import { getKpis, getPortfolio, listAgents, listDelegations, listExecutions } from "@/agents/store";

export type AskAnswer = {
  question: string;
  thesis: string;
  points: string[];
  evidence: { label: string; value: string }[];
  related: string[];
  asOfMs: number;
};

/**
 * Deterministic fallback for Q&A when no AI API key is configured.
 * Answers are computed live from the in-memory swarm state.
 */
export function answerSwarm(questionRaw: string): AskAnswer {
  const question = questionRaw.trim();
  const q = question.toLowerCase();

  const kpis = getKpis();
  const portfolio = getPortfolio();
  const agents = listAgents().filter((a) => a.role !== "master");
  const delegations = listDelegations();
  const executions = listExecutions(5);

  const topAgent = [...agents].sort((a, b) => b.currentApyBps - a.currentApyBps)[0];
  const totalDeployed = kpis.totalDeployedUsdc;
  const avgApy = kpis.avgApyBps / 100;

  const baseEvidence: { label: string; value: string }[] = [
    { label: "deployed", value: `$${totalDeployed.toLocaleString()}` },
    { label: "avg APY", value: `${avgApy.toFixed(2)}%` },
    { label: "yield earned", value: `$${kpis.totalYieldUsdc.toFixed(2)}` },
  ];

  const has = (...kw: string[]) => kw.some((k) => q.includes(k));

  // Best APY / yield / opportunity
  if (has("best", "top", "highest", "apy", "yield", "earn", "opportunit", "right now", "which agent")) {
    return {
      question,
      thesis: topAgent
        ? `The best yield right now is ${topAgent.name} at ${(topAgent.currentApyBps / 100).toFixed(2)}% APY — $${(topAgent.deployedUsdc * topAgent.currentApyBps / 10_000 / 365 * 7).toFixed(2)} estimated weekly on $${topAgent.deployedUsdc.toLocaleString()} deployed.`
        : "No agents are currently tracking APY. Run a swarm cycle to fetch live rates.",
      points: agents.map((a) => `${a.name}: ${(a.currentApyBps / 100).toFixed(2)}% APY · $${a.deployedUsdc.toLocaleString()} deployed · +$${a.earnedUsdc.toFixed(2)} earned`),
      evidence: [
        ...(topAgent ? [{ label: "best APY", value: `${(topAgent.currentApyBps / 100).toFixed(2)}%` }, { label: "agent", value: topAgent.name }] : []),
        ...baseEvidence,
      ],
      related: ["How is my USDC allocated?", "What has been earned so far?", "When did the last rebalance happen?"],
      asOfMs: Date.now(),
    };
  }

  // Portfolio / allocation / capital
  if (has("portfolio", "allocat", "capital", "deployed", "how much", "balance", "idle")) {
    const byAgentLines = agents.map((a) => {
      const pct = totalDeployed > 0 ? ((a.deployedUsdc / totalDeployed) * 100).toFixed(1) : "0";
      return `${a.name}: $${a.deployedUsdc.toLocaleString()} (${pct}% of deployed)`;
    });
    return {
      question,
      thesis: `$${totalDeployed.toLocaleString()} USDC is actively deployed across ${agents.length} agents. $${portfolio.idleUsdc.toLocaleString()} is idle within the granted ERC-7715 cap of $${portfolio.totalUsdc.toLocaleString()}.`,
      points: [...byAgentLines, `Weekly yield estimate: $${portfolio.weeklyYieldUsdc.toFixed(2)} at current APY blend.`],
      evidence: [
        { label: "total cap", value: `$${portfolio.totalUsdc.toLocaleString()}` },
        { label: "deployed", value: `$${totalDeployed.toLocaleString()}` },
        { label: "idle", value: `$${portfolio.idleUsdc.toLocaleString()}` },
        { label: "weekly est.", value: `$${portfolio.weeklyYieldUsdc.toFixed(2)}` },
      ],
      related: ["Which agent has the best APY?", "What has been earned so far?", "How does the delegation work?"],
      asOfMs: Date.now(),
    };
  }

  // Yield earned / profit / PnL
  if (has("earn", "profit", "pnl", "made", "captured", "return", "performance", "so far", "total")) {
    return {
      question,
      thesis: `The swarm has earned $${kpis.totalYieldUsdc.toFixed(2)} USDC in total yield across all agents since deployment.`,
      points: [
        ...agents.map((a) => `${a.name}: +$${a.earnedUsdc.toFixed(2)} earned at ${(a.currentApyBps / 100).toFixed(2)}% APY`),
        `Estimated annual at current rates: $${(portfolio.weeklyYieldUsdc * 52).toFixed(0)}`,
      ],
      evidence: [
        { label: "total earned", value: `$${kpis.totalYieldUsdc.toFixed(2)}` },
        { label: "agents", value: String(agents.length) },
        { label: "avg APY", value: `${avgApy.toFixed(2)}%` },
      ],
      related: ["How is my USDC allocated?", "Which agent has the best APY?", "What was the last transaction?"],
      asOfMs: Date.now(),
    };
  }

  // Delegation / permissions / ERC-7710 / ERC-7715
  if (has("delegat", "permission", "erc-7710", "erc-7715", "subdelegat", "master", "orchestrat")) {
    const activeDels = delegations.filter((d) => d.status === "active");
    return {
      question,
      thesis: `The Master Orchestrator holds a single ERC-7715 permission from your wallet — $${portfolio.totalUsdc.toLocaleString()} USDC weekly spending cap — and subdelegates via ERC-7710 to ${activeDels.length} active sub-agents.`,
      points: activeDels.map((d) => `${d.to}: $${d.usedUsdc.toLocaleString()} / $${d.capUsdc.toLocaleString()} cap used (${d.status})`),
      evidence: [
        { label: "active delegations", value: String(activeDels.length) },
        { label: "ERC-7715 cap", value: `$${portfolio.totalUsdc.toLocaleString()}` },
        { label: "deployed", value: `$${totalDeployed.toLocaleString()}` },
      ],
      related: ["How is my USDC allocated?", "Which agent has the best APY?", "How do I rebalance?"],
      asOfMs: Date.now(),
    };
  }

  // Rebalance / history / last action
  if (has("rebalanc", "last", "recent", "histor", "transaction", "execution", "action", "when")) {
    const lastExec = executions[0];
    return {
      question,
      thesis: lastExec
        ? `The last swarm action was ${lastExec.action} by ${lastExec.agentName} — $${lastExec.amountUsdc.toLocaleString()} USDC at ${(lastExec.apyBps / 100).toFixed(2)}% APY${lastExec.txHash ? ` (tx: ${lastExec.txHash.slice(0, 10)}…)` : ""}.`
        : "No executions recorded yet. Run a swarm cycle or deploy USDC from the Command page.",
      points: executions.map((e) => `${e.agentName} · ${e.action} · $${e.amountUsdc} USDC · ${new Date(e.atMs).toLocaleTimeString()}`),
      evidence: [
        ...(lastExec ? [{ label: "last action", value: lastExec.action }, { label: "by", value: lastExec.agentName }] : []),
        ...baseEvidence,
      ],
      related: ["How is my USDC allocated?", "What has been earned so far?", "Which agent has the best APY?"],
      asOfMs: Date.now(),
    };
  }

  // How it works / strategy / explain
  if (has("how", "work", "explain", "strateg", "what is", "nexus", "swarm", "a2a", "agent")) {
    return {
      question,
      thesis: "Nexus-A2A is a DeFi yield swarm — you grant one ERC-7715 permission to the Master Orchestrator, which subdelegates via ERC-7710 to specialized agents that autonomously deploy your USDC across Aave, Uniswap, and Hyperliquid.",
      points: [
        "You sign once (ERC-7715). The swarm handles approvals, deposits, and rebalancing.",
        "ERC-7710 subdelegations let agents act within their cap — no private key handoff, fully revocable.",
        "Gas is paid in USDC via 1Shot (EIP-5792 batch) — no ETH needed.",
        `Right now: ${agents.length} agents live, $${totalDeployed.toLocaleString()} deployed, ${avgApy.toFixed(2)}% avg APY.`,
      ],
      evidence: baseEvidence,
      related: ["Which agent has the best APY?", "How is my USDC allocated?", "What has been earned so far?"],
      asOfMs: Date.now(),
    };
  }

  // Protocols / agents
  if (has("aave", "uniswap", "lido", "hyperliquid", "perp", "protocol", "agent")) {
    const mentioned = agents.filter((a) =>
      q.includes(a.name.toLowerCase()) || q.includes(a.protocol?.toLowerCase() ?? "")
    );
    const relevant = mentioned.length > 0 ? mentioned : agents;
    return {
      question,
      thesis: `Nexus-A2A runs ${agents.length} active agents across DeFi protocols: ${agents.map((a) => `${a.name} (${(a.currentApyBps / 100).toFixed(2)}%)`).join(", ")}.`,
      points: relevant.map((a) => `${a.name} · ${a.protocol} · ${(a.currentApyBps / 100).toFixed(2)}% APY · $${a.deployedUsdc.toLocaleString()} deployed · +$${a.earnedUsdc.toFixed(2)} earned`),
      evidence: [{ label: "agents", value: String(agents.length) }, ...baseEvidence],
      related: ["Which agent has the best APY?", "How is my USDC allocated?", "What has been earned so far?"],
      asOfMs: Date.now(),
    };
  }

  // Fallback
  return {
    question,
    thesis: `Swarm status: $${totalDeployed.toLocaleString()} deployed across ${agents.length} agents at ${avgApy.toFixed(2)}% avg APY · $${kpis.totalYieldUsdc.toFixed(2)} earned total.`,
    points: [
      "Ask me about APY, allocation, yield earned, delegation structure, or specific protocols.",
      ...agents.map((a) => `${a.name}: ${(a.currentApyBps / 100).toFixed(2)}% APY · $${a.deployedUsdc.toLocaleString()} deployed`),
    ],
    evidence: baseEvidence,
    related: ["Which agent has the best APY?", "How is my USDC allocated?", "What has been earned so far?", "How does the delegation work?"],
    asOfMs: Date.now(),
  };
}
