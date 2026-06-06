export type ChainId = "ARC" | "ETH" | "BASE" | "ARB" | "HL" | "CEX";

export type VenueKind = "DEX" | "CEX" | "PERP";

export type Venue = {
  id: string;
  name: string;
  chain: ChainId;
  kind: VenueKind;
};

export type Token = "USDC" | "EURC" | "ETH" | "BTC" | "SOL";

export type PriceEdge = {
  from: Token;
  to: Token;
  venueId: string;
  /** units of `to` you receive per 1 unit of `from`, before fees */
  rate: number;
  feeBps: number;
  liquidityUsdc: number;
  updatedAtMs: number;
};

export type Cycle = {
  /** ordered list of tokens forming the closed loop, last == first */
  nodes: Token[];
  /** edges traversed (length = nodes.length - 1) */
  edges: PriceEdge[];
  /** net basis points after fees (positive => profitable) */
  netBps: number;
  /** liquidity floor across edges, in USDC */
  liquidityFloorUsdc: number;
};

export type OpportunityStatus = "candidate" | "queued" | "executing" | "captured" | "rejected";

export type Opportunity = {
  id: string;
  createdAtMs: number;
  cycle: Cycle;
  sizeUsdc: number;
  expectedProfitUsdc: number;
  status: OpportunityStatus;
  rejectReason?: string;
};

export type Execution = {
  id: string;
  opportunityId: string;
  atMs: number;
  cycleString: string;
  venueString: string;
  sizeUsdc: number;
  realizedUsdc: number;
  netBps: number;
  latencyMs: number;
  txHash: string;
  success: boolean;
};

export type Treasury = {
  usdcWorking: number;
  usdcByVenue: Record<string, number>;
  usycParked: number;
  eurcWorking: number;
};

export type SwarmKpis = {
  opportunitiesScanned: number;
  opportunitiesCaptured: number;
  totalProfitUsdc: number;
  totalVolumeUsdc: number;
  avgLatencyMs: number;
  successRate: number;
  lastScanAtMs: number;
  cyclesAboveThreshold: number;
};
