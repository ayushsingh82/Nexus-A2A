import { fetchLiveYields } from "./yields";
import type {
  Agent,
  AgentExecution,
  Delegation,
  Portfolio,
  SwarmKpis,
  YieldOpportunity,
} from "./types";

/**
 * In-memory swarm store — singleton across module reloads via globalThis.
 *
 * Architecture:
 *   User grants ERC-7715 permission (500k USDC/week) to Master Orchestrator.
 *   Master subdelegates via ERC-7710:
 *     • Aave Agent     ← 200k USDC cap  → Aave v3 USDC supply
 *     • Uniswap Agent  ← 150k USDC cap  → Uniswap V3 USDC/ETH LP
 *     • Perp Agent     ← 150k USDC cap  → Hyperliquid BTC perp funding
 *
 *   On every runSwarm():
 *     1. Fetch live APY from DeFiLlama + Hyperliquid
 *     2. Agents collect yield (1 day's worth per tick)
 *     3. Master may rebalance: redelegate 5-15k USDC from underperformer → top
 *     4. Record executions + update portfolio/KPIs
 */

type Store = {
  agents: Agent[];
  delegations: Delegation[];
  opportunities: YieldOpportunity[];
  executions: AgentExecution[];
  portfolio: Portfolio;
  kpis: SwarmKpis;
};

const KEY = "__nexus_store__" as const;

function getStore(): Store {
  const g = globalThis as unknown as Record<string, Store | undefined>;
  if (!g[KEY]) g[KEY] = createSeed();
  return g[KEY]!;
}

// ── public reads ────────────────────────────────────────────────────────────

export function listAgents(): Agent[] {
  return getStore().agents;
}

export function listDelegations(): Delegation[] {
  return getStore().delegations;
}

export function listOpportunities(): YieldOpportunity[] {
  return getStore().opportunities;
}

export function listExecutions(limit = 12): AgentExecution[] {
  return getStore().executions.slice(0, limit);
}

export function getPortfolio(): Portfolio {
  return { ...getStore().portfolio, byAgent: { ...getStore().portfolio.byAgent } };
}

export function getKpis(): SwarmKpis {
  return { ...getStore().kpis };
}

// ── swarm tick ──────────────────────────────────────────────────────────────

export async function runSwarm(): Promise<{
  yieldCollectedUsdc: number;
  rebalanced: boolean;
  rebalanceDetails?: string;
  ok: { defillama: boolean; hyperliquid: boolean };
}> {
  const store = getStore();
  const now = Date.now();

  // 1. fetch live yields
  const liveYields = await fetchLiveYields();

  // jitter ±3% around live rates to simulate intraday volatility
  const jitter = () => 1 + (Math.random() - 0.5) * 0.06;

  const aaveApy  = Math.round(liveYields.aaveApyBps * jitter());
  const uniApy   = Math.round(liveYields.uniswapLpApyBps * jitter());
  const perpApy  = Math.round(liveYields.perpFundingApyBps * jitter());

  // update sub-agent APYs
  const aaveAgent  = store.agents.find((a) => a.role === "aave")!;
  const uniAgent   = store.agents.find((a) => a.role === "uniswap-lp")!;
  const perpAgent  = store.agents.find((a) => a.role === "perp-funding")!;
  const master     = store.agents.find((a) => a.role === "master")!;

  aaveAgent.currentApyBps  = aaveApy;
  uniAgent.currentApyBps   = uniApy;
  perpAgent.currentApyBps  = perpApy;

  // 2. each agent collects 1 day's yield
  let totalYieldThisTick = 0;
  const subAgents = [aaveAgent, uniAgent, perpAgent];
  const yieldExecutions: AgentExecution[] = [];

  for (const agent of subAgents) {
    const dailyYield = round(agent.deployedUsdc * (agent.currentApyBps / 10_000) / 365, 4);
    agent.earnedUsdc = round(agent.earnedUsdc + dailyYield, 4);
    totalYieldThisTick += dailyYield;
    agent.lastActionAtMs = now;
    agent.status = "active";

    const delId = store.delegations.find((d) => d.to === agent.role)?.id ?? "DEL-?";
    yieldExecutions.push({
      id: `EX-${randomId()}`,
      agentId: agent.id,
      agentName: agent.name,
      protocol: agent.protocol,
      action: "collect-yield",
      amountUsdc: agent.deployedUsdc,
      yieldUsdc: dailyYield,
      apyBps: agent.currentApyBps,
      delegationId: delId,
      atMs: now,
      txHash: fakeTxHash(),
      success: true,
    });
  }

  // 3. master rebalance — 25% chance per tick
  let rebalanced = false;
  let rebalanceDetails: string | undefined;

  if (Math.random() < 0.25) {
    // find lowest and highest APY sub-agents
    const sorted = [...subAgents].sort((a, b) => a.currentApyBps - b.currentApyBps);
    const loser  = sorted[0];
    const winner = sorted[sorted.length - 1];

    if (winner.currentApyBps - loser.currentApyBps > 100) {
      // redelegate 5-15k USDC from loser → winner
      const amount = 5_000 + Math.floor(Math.random() * 10_001);
      const safeAmount = Math.min(amount, loser.deployedUsdc * 0.3);

      if (safeAmount > 1_000) {
        loser.deployedUsdc  = round(loser.deployedUsdc - safeAmount, 2);
        winner.deployedUsdc = round(winner.deployedUsdc + safeAmount, 2);
        loser.delegatedCapUsdc  = round(loser.delegatedCapUsdc - safeAmount, 2);
        winner.delegatedCapUsdc = round(winner.delegatedCapUsdc + safeAmount, 2);

        // update delegation caps
        const loserDel  = store.delegations.find((d) => d.to === loser.role);
        const winnerDel = store.delegations.find((d) => d.to === winner.role);
        if (loserDel)  { loserDel.capUsdc  = loser.delegatedCapUsdc;  loserDel.usedUsdc  = loser.deployedUsdc; }
        if (winnerDel) { winnerDel.capUsdc = winner.delegatedCapUsdc; winnerDel.usedUsdc = winner.deployedUsdc; }

        master.lastActionAtMs = now;
        master.status = "rebalancing";
        setTimeout(() => { master.status = "active"; }, 3000);

        rebalanced = true;
        rebalanceDetails = `${safeAmount.toFixed(0)} USDC → ${winner.name} (${(winner.currentApyBps / 100).toFixed(1)}% APY)`;
        store.kpis.rebalanceCount += 1;

        yieldExecutions.unshift({
          id: `EX-${randomId()}`,
          agentId: "master",
          agentName: "Master Orchestrator",
          protocol: "ERC-7710 Redelegation",
          action: "redelegate",
          amountUsdc: safeAmount,
          yieldUsdc: 0,
          apyBps: winner.currentApyBps,
          delegationId: winnerDel?.id ?? "DEL-?",
          atMs: now,
          txHash: fakeTxHash(),
          success: true,
        });
      }
    }
  }

  // 4. prepend executions (keep last 200)
  store.executions.unshift(...yieldExecutions);
  if (store.executions.length > 200) store.executions.length = 200;

  // 5. rebuild opportunities from live agent state
  store.opportunities = subAgents.map((agent) => ({
    id: `OPP-${agent.id.toUpperCase()}`,
    agentId: agent.id,
    agentName: agent.name,
    protocol: agent.protocol,
    asset: agent.role === "aave" ? "USDC" : agent.role === "uniswap-lp" ? "USDC/ETH LP" : "BTC Perp Funding",
    apyBps: agent.currentApyBps,
    deployedUsdc: agent.deployedUsdc,
    earnedUsdc: agent.earnedUsdc,
    status: "active" as const,
    updatedAtMs: now,
  }));

  // 6. update portfolio
  store.portfolio = buildPortfolio(store.agents);

  // 7. update KPIs
  const totalYield = subAgents.reduce((s, a) => s + a.earnedUsdc, 0);
  const weightedApy =
    subAgents.reduce((s, a) => s + a.currentApyBps * a.deployedUsdc, 0) /
    (subAgents.reduce((s, a) => s + a.deployedUsdc, 0) || 1);

  store.kpis.totalDeployedUsdc = store.portfolio.deployedUsdc;
  store.kpis.totalYieldUsdc    = round(totalYield, 4);
  store.kpis.avgApyBps         = Math.round(weightedApy);
  store.kpis.activeAgents      = subAgents.filter((a) => a.deployedUsdc > 0).length;
  store.kpis.delegationsActive = store.delegations.filter((d) => d.status === "active").length;
  store.kpis.lastSwarmAtMs     = now;
  store.kpis.swarmRunCount    += 1;

  return {
    yieldCollectedUsdc: round(totalYieldThisTick, 4),
    rebalanced,
    rebalanceDetails,
    ok: liveYields.ok,
  };
}

// ── real tx recording ────────────────────────────────────────────────────────

export function recordRealDeposit(params: {
  agentId: string;
  agentName?: string;
  protocol?: string;
  action?: string;
  amountUsdc: number;
  txHash: string;
  apyBps?: number;
}) {
  const store = getStore();
  const agent = store.agents.find(
    (a) => a.id === params.agentId || a.role === params.agentId
  );

  if (agent && agent.role !== "master" && params.action !== "withdraw") {
    agent.deployedUsdc = round(agent.deployedUsdc + params.amountUsdc, 2);
    agent.delegatedCapUsdc = Math.max(agent.delegatedCapUsdc, agent.deployedUsdc);
    agent.lastActionAtMs = Date.now();
    agent.status = "active";
    const del = store.delegations.find((d) => d.to === agent.role);
    if (del) del.usedUsdc = agent.deployedUsdc;
  } else if (agent && agent.role !== "master" && params.action === "withdraw") {
    agent.deployedUsdc = round(Math.max(0, agent.deployedUsdc - params.amountUsdc), 2);
    const del = store.delegations.find((d) => d.to === agent.role);
    if (del) del.usedUsdc = agent.deployedUsdc;
  }

  const execution: AgentExecution = {
    id: `EX-REAL-${randomId()}`,
    agentId: params.agentId,
    agentName: params.agentName ?? agent?.name ?? params.agentId,
    protocol: params.protocol ?? agent?.protocol ?? "On-chain",
    action: (params.action as AgentExecution["action"]) ?? "deposit",
    amountUsdc: params.amountUsdc,
    yieldUsdc: 0,
    apyBps: params.apyBps ?? agent?.currentApyBps ?? 0,
    delegationId: store.delegations.find((d) => d.to === agent?.role)?.id ?? "ERC-7710",
    atMs: Date.now(),
    txHash: params.txHash,
    success: true,
  };

  store.executions.unshift(execution);
  if (store.executions.length > 200) store.executions.length = 200;
  store.portfolio = buildPortfolio(store.agents);
  store.kpis.totalDeployedUsdc = store.portfolio.deployedUsdc;
}

// ── helpers / seed ───────────────────────────────────────────────────────────

function fakeTxHash(): string {
  return "0x" + Array.from({ length: 6 }, () => Math.floor(Math.random() * 16).toString(16)).join("") + "…";
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function round(n: number, dp = 2): number {
  const m = Math.pow(10, dp);
  return Math.round(n * m) / m;
}

function buildPortfolio(agents: Agent[]): Portfolio {
  const subAgents = agents.filter((a) => a.role !== "master");
  const deployed  = subAgents.reduce((s, a) => s + a.deployedUsdc, 0);
  const master    = agents.find((a) => a.role === "master")!;
  const totalCap  = master.delegatedCapUsdc;
  const totalYield = subAgents.reduce((s, a) => s + a.earnedUsdc, 0);

  // weekly yield estimate from current APYs
  const weeklyYield = subAgents.reduce(
    (s, a) => s + a.deployedUsdc * (a.currentApyBps / 10_000) / 52,
    0,
  );

  return {
    totalUsdc: round(totalCap, 2),
    deployedUsdc: round(deployed, 2),
    idleUsdc: round(totalCap - deployed, 2),
    totalYieldUsdc: round(totalYield, 4),
    weeklyYieldUsdc: round(weeklyYield, 2),
    byAgent: Object.fromEntries(subAgents.map((a) => [a.id, round(a.deployedUsdc, 2)])),
  };
}

/**
 * Cold-start seed: empty portfolio, no history.
 * APY rates are seeded but deployedUsdc starts at 0 — real txs via command page populate it.
 */
function createSeed(): Store {
  const now = Date.now();
  const launchMs = now;

  const agents: Agent[] = [
    {
      id: "master",
      name: "Master Orchestrator",
      role: "master",
      protocol: "MetaMask Smart Accounts (ERC-7710)",
      chain: "Base",
      status: "active",
      delegatedCapUsdc: 500,
      deployedUsdc: 0,
      earnedUsdc: 0,
      currentApyBps: 0,
      lastActionAtMs: now,
    },
    {
      id: "aave",
      name: "Aave Agent",
      role: "aave",
      protocol: "Aave v3",
      chain: "Base",
      status: "idle",
      delegatedCapUsdc: 200,
      deployedUsdc: 0,
      earnedUsdc: 0,
      currentApyBps: 520,
      lastActionAtMs: now,
    },
    {
      id: "uniswap",
      name: "Uniswap LP Agent",
      role: "uniswap-lp",
      protocol: "Uniswap V3",
      chain: "Base",
      status: "idle",
      delegatedCapUsdc: 150,
      deployedUsdc: 0,
      earnedUsdc: 0,
      currentApyBps: 840,
      lastActionAtMs: now,
    },
    {
      id: "perp",
      name: "Perp Funding Agent",
      role: "perp-funding",
      protocol: "Hyperliquid",
      chain: "Base",
      status: "idle",
      delegatedCapUsdc: 150,
      deployedUsdc: 0,
      earnedUsdc: 0,
      currentApyBps: 1120,
      lastActionAtMs: now,
    },
  ];

  const delegations: Delegation[] = [
    {
      id: "DEL-001",
      from: "master",
      to: "aave",
      capUsdc: 200,
      usedUsdc: 0,
      permissionType: "erc20-token-periodic",
      grantedAtMs: launchMs,
      expiresAtMs: launchMs + 30 * 24 * 60 * 60 * 1000 * 4,
      status: "active",
    },
    {
      id: "DEL-002",
      from: "master",
      to: "uniswap-lp",
      capUsdc: 150,
      usedUsdc: 0,
      permissionType: "erc20-token-periodic",
      grantedAtMs: launchMs,
      expiresAtMs: launchMs + 30 * 24 * 60 * 60 * 1000 * 4,
      status: "active",
    },
    {
      id: "DEL-003",
      from: "master",
      to: "perp-funding",
      capUsdc: 150,
      usedUsdc: 0,
      permissionType: "erc20-token-periodic",
      grantedAtMs: launchMs,
      expiresAtMs: launchMs + 30 * 24 * 60 * 60 * 1000 * 4,
      status: "active",
    },
  ];

  const subAgents = agents.filter((a) => a.role !== "master");
  const opportunities: YieldOpportunity[] = subAgents.map((agent) => ({
    id: `OPP-${agent.id.toUpperCase()}`,
    agentId: agent.id,
    agentName: agent.name,
    protocol: agent.protocol,
    asset: agent.role === "aave" ? "USDC" : agent.role === "uniswap-lp" ? "USDC/ETH LP" : "BTC Perp Funding",
    apyBps: agent.currentApyBps,
    deployedUsdc: 0,
    earnedUsdc: 0,
    status: "active",
    updatedAtMs: now,
  }));

  const portfolio = buildPortfolio(agents);

  const kpis: SwarmKpis = {
    totalDeployedUsdc: 0,
    totalYieldUsdc: 0,
    avgApyBps: 0,
    activeAgents: 0,
    rebalanceCount: 0,
    delegationsActive: 3,
    lastSwarmAtMs: 0,
    swarmRunCount: 0,
  };

  return { agents, delegations, opportunities, executions: [], portfolio, kpis };
}
