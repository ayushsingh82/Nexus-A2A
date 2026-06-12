export type AgentRole = "master" | "aave" | "uniswap-lp" | "perp-funding";
export type AgentStatus = "idle" | "scanning" | "deploying" | "active" | "rebalancing";

export type Agent = {
  id: string;
  name: string;
  role: AgentRole;
  protocol: string;
  chain: string;
  status: AgentStatus;
  /** USDC cap subdelegated from master via ERC-7710 */
  delegatedCapUsdc: number;
  /** USDC currently deployed in the protocol */
  deployedUsdc: number;
  /** total USDC yield earned since launch */
  earnedUsdc: number;
  /** current annualised yield in basis points */
  currentApyBps: number;
  lastActionAtMs: number;
};

export type DelegationStatus = "active" | "consumed" | "revoked";

export type Delegation = {
  id: string;
  from: AgentRole;
  to: AgentRole;
  /** spending cap granted to the delegatee */
  capUsdc: number;
  /** how much of the cap has been used */
  usedUsdc: number;
  /** ERC-7715 permission type backing this delegation */
  permissionType: string;
  grantedAtMs: number;
  expiresAtMs: number;
  status: DelegationStatus;
};

export type YieldOpportunityStatus = "scanning" | "deploying" | "active" | "rebalancing";

export type YieldOpportunity = {
  id: string;
  agentId: string;
  agentName: string;
  protocol: string;
  asset: string;
  apyBps: number;
  deployedUsdc: number;
  earnedUsdc: number;
  status: YieldOpportunityStatus;
  updatedAtMs: number;
};

export type AgentExecution = {
  id: string;
  agentId: string;
  agentName: string;
  protocol: string;
  action: "deposit" | "withdraw" | "rebalance" | "collect-yield" | "redelegate";
  amountUsdc: number;
  yieldUsdc: number;
  apyBps: number;
  delegationId: string;
  atMs: number;
  txHash: string;
  success: boolean;
};

export type Portfolio = {
  totalUsdc: number;
  deployedUsdc: number;
  idleUsdc: number;
  totalYieldUsdc: number;
  weeklyYieldUsdc: number;
  /** deployed USDC per agent id */
  byAgent: Record<string, number>;
};

export type SwarmKpis = {
  totalDeployedUsdc: number;
  totalYieldUsdc: number;
  avgApyBps: number;
  activeAgents: number;
  rebalanceCount: number;
  delegationsActive: number;
  lastSwarmAtMs: number;
  swarmRunCount: number;
};
