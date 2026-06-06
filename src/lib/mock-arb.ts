export type Venue = {
  id: string;
  name: string;
  chain: string;
  kind: "DEX" | "CEX" | "PERP";
};

export type PriceEdge = {
  from: string;
  to: string;
  venue: string;
  rate: number;
  feeBps: number;
  liquidityUsdc: number;
  updatedAtMsAgo: number;
};

export type Opportunity = {
  id: string;
  cycle: string[];
  venues: string[];
  netBps: number;
  expectedProfitUsdc: number;
  sizeUsdc: number;
  liquidityFloor: number;
  status: "candidate" | "queued" | "executing";
};

export type Execution = {
  id: string;
  at: string;
  cycle: string;
  venues: string;
  sizeUsdc: number;
  realizedUsdc: number;
  netBps: number;
  latencyMs: number;
  txHash: string;
  success: boolean;
};

export type WalletRow = {
  venue: string;
  chain: string;
  address: string;
  usdcBalance: number;
};

export const kpis = {
  opportunitiesScanned: 18_412,
  opportunitiesCaptured: 287,
  totalProfitUsdc: 1_846.32,
  avgLatencyMs: 412,
  successRate: 0.91,
  treasuryUsdc: 28_140,
  usycParked: 71_500,
  unifiedBalance: 99_640,
};

export const venues: Venue[] = [
  { id: "hl",       name: "Hyperliquid",     chain: "HL",     kind: "PERP" },
  { id: "uni-eth",  name: "Uniswap V3",       chain: "ETH",    kind: "DEX" },
  { id: "uni-base", name: "Uniswap V3",       chain: "BASE",   kind: "DEX" },
  { id: "curve",    name: "Curve",            chain: "ETH",    kind: "DEX" },
  { id: "uni-arb",  name: "Uniswap V3",       chain: "ARB",    kind: "DEX" },
  { id: "binance",  name: "Binance",          chain: "CEX",    kind: "CEX" },
];

export const edges: PriceEdge[] = [
  { from: "USDC", to: "ETH",  venue: "uni-eth",  rate: 1 / 3181.4,  feeBps: 5,  liquidityUsdc: 412_000, updatedAtMsAgo: 320 },
  { from: "ETH",  to: "USDC", venue: "uni-base", rate: 3187.8,      feeBps: 5,  liquidityUsdc: 188_000, updatedAtMsAgo: 410 },
  { from: "USDC", to: "BTC",  venue: "binance",  rate: 1 / 67_402,  feeBps: 10, liquidityUsdc: 980_000, updatedAtMsAgo: 220 },
  { from: "BTC",  to: "USDC", venue: "hl",       rate: 67_491,      feeBps: 8,  liquidityUsdc: 540_000, updatedAtMsAgo: 280 },
  { from: "USDC", to: "EURC", venue: "curve",    rate: 0.9213,      feeBps: 2,  liquidityUsdc: 720_000, updatedAtMsAgo: 600 },
  { from: "EURC", to: "USDC", venue: "uni-arb",  rate: 1.0848,      feeBps: 4,  liquidityUsdc: 310_000, updatedAtMsAgo: 540 },
];

export const opportunities: Opportunity[] = [
  {
    id: "OPP-7421",
    cycle: ["USDC", "ETH", "USDC"],
    venues: ["uni-eth", "uni-base"],
    netBps: 12.4,
    expectedProfitUsdc: 14.88,
    sizeUsdc: 12_000,
    liquidityFloor: 188_000,
    status: "executing",
  },
  {
    id: "OPP-7418",
    cycle: ["USDC", "EURC", "USDC"],
    venues: ["curve", "uni-arb"],
    netBps: 7.1,
    expectedProfitUsdc: 5.32,
    sizeUsdc: 7_500,
    liquidityFloor: 310_000,
    status: "queued",
  },
  {
    id: "OPP-7416",
    cycle: ["USDC", "BTC", "USDC"],
    venues: ["binance", "hl"],
    netBps: 9.8,
    expectedProfitUsdc: 19.6,
    sizeUsdc: 20_000,
    liquidityFloor: 540_000,
    status: "candidate",
  },
  {
    id: "OPP-7414",
    cycle: ["USDC", "ETH", "BTC", "USDC"],
    venues: ["uni-eth", "binance", "hl"],
    netBps: 4.2,
    expectedProfitUsdc: 4.2,
    sizeUsdc: 10_000,
    liquidityFloor: 188_000,
    status: "candidate",
  },
];

export const executions: Execution[] = [
  { id: "EX-2841", at: "12s ago",  cycle: "USDC→ETH→USDC",       venues: "uni-eth ▸ uni-base",        sizeUsdc: 8_400,  realizedUsdc: 11.42, netBps: 13.6, latencyMs: 384, txHash: "0xa1b2c3…", success: true },
  { id: "EX-2840", at: "44s ago",  cycle: "USDC→EURC→USDC",      venues: "curve ▸ uni-arb",           sizeUsdc: 5_200,  realizedUsdc: 3.71,  netBps: 7.1,  latencyMs: 478, txHash: "0xd4e5f6…", success: true },
  { id: "EX-2839", at: "1m ago",   cycle: "USDC→BTC→USDC",       venues: "binance ▸ hl",              sizeUsdc: 14_000, realizedUsdc: 13.86, netBps: 9.9,  latencyMs: 412, txHash: "0x7a8b9c…", success: true },
  { id: "EX-2838", at: "2m ago",   cycle: "USDC→ETH→BTC→USDC",   venues: "uni-eth ▸ binance ▸ hl",    sizeUsdc: 9_500,  realizedUsdc: -1.20, netBps: -1.3, latencyMs: 612, txHash: "0xfee123…", success: false },
  { id: "EX-2837", at: "3m ago",   cycle: "USDC→ETH→USDC",       venues: "uni-base ▸ uni-eth",        sizeUsdc: 6_000,  realizedUsdc: 7.20,  netBps: 12.0, latencyMs: 354, txHash: "0x456abc…", success: true },
  { id: "EX-2836", at: "5m ago",   cycle: "USDC→EURC→USDC",      venues: "uni-arb ▸ curve",           sizeUsdc: 4_000,  realizedUsdc: 2.88,  netBps: 7.2,  latencyMs: 488, txHash: "0xdef789…", success: true },
];

export const wallets: WalletRow[] = [
  { venue: "Hyperliquid",   chain: "HL",   address: "0x4a91…b3c2", usdcBalance: 6_240 },
  { venue: "Uniswap V3",    chain: "ETH",  address: "0x2c19…8a14", usdcBalance: 5_180 },
  { venue: "Uniswap V3",    chain: "BASE", address: "0x9f4b…1d77", usdcBalance: 4_920 },
  { venue: "Curve",         chain: "ETH",  address: "0x71c4…ff03", usdcBalance: 3_660 },
  { venue: "Uniswap V3",    chain: "ARB",  address: "0x88aa…20e1", usdcBalance: 4_140 },
  { venue: "Binance (ref)", chain: "CEX",  address: "—",           usdcBalance: 0     },
];
