import { fetchBinanceQuotes, type BinanceQuotes } from "./binance";
import { fetchHlQuotes, type HlQuotes } from "./hyperliquid";
import { fetchChainlinkQuotes, type ChainlinkQuotes } from "./chainlink";
import type { PriceEdge, Token } from "@/graph/types";

/**
 * Builds the live PriceEdge[] from three real public data sources.
 *
 * - Hyperliquid → USDC↔{ETH,BTC,SOL} edges (HL is USDC-quoted perp mid)
 * - Binance     → USDC↔{ETH,BTC,SOL,EURC} edges (USDT ≈ USDC for signal)
 * - Chainlink   → USDC↔{ETH,BTC,EURC} edges (oracle reference, 0 bps)
 *
 * All three fetches happen in parallel. If any fail, we still emit edges from
 * the venue(s) that succeeded; if all fail, the caller falls back to seed.
 *
 * Fees:
 *   HL perp taker:     ~3 bps (treated as 5 bps to be safe)
 *   Binance spot taker: 10 bps
 *   Chainlink:          0 bps (oracle reference, not a real tradeable venue)
 *
 * Chainlink edges have very thin liquidity (effectively the size that the
 * actual liquidity provider on Arc would arb against the oracle) — the
 * sizing layer clamps to this floor, so its only purpose is to surface
 * stale-oracle vs CEX-spot opportunities for the agent to attempt onchain.
 */

const HL_FEE_BPS = 5;
const BINANCE_FEE_BPS = 10;
const CHAINLINK_FEE_BPS = 0;

const HL_LIQUIDITY_USDC = 500_000;
const BINANCE_LIQUIDITY_USDC = 1_000_000;
const CHAINLINK_LIQUIDITY_USDC = 50_000;

export type RefreshResult = {
  edges: PriceEdge[];
  ok: { hyperliquid: boolean; binance: boolean; chainlink: boolean };
  fetchedAtMs: number;
};

export async function refreshLiveEdges(): Promise<RefreshResult> {
  const [hlRes, bnRes, clRes] = await Promise.allSettled([
    fetchHlQuotes(),
    fetchBinanceQuotes(),
    fetchChainlinkQuotes(),
  ]);

  const edges: PriceEdge[] = [];
  const ok = {
    hyperliquid: hlRes.status === "fulfilled",
    binance: bnRes.status === "fulfilled",
    chainlink: clRes.status === "fulfilled",
  };

  if (hlRes.status === "fulfilled") edges.push(...edgesFromHl(hlRes.value));
  if (bnRes.status === "fulfilled") edges.push(...edgesFromBinance(bnRes.value));
  if (clRes.status === "fulfilled") edges.push(...edgesFromChainlink(clRes.value));

  return { edges, ok, fetchedAtMs: Date.now() };
}

function pushPair(
  out: PriceEdge[],
  token: Token,
  price: number,
  venueId: string,
  feeBps: number,
  liquidity: number,
  t: number,
) {
  if (price <= 0) return;
  out.push({
    from: "USDC", to: token, venueId,
    rate: 1 / price, feeBps, liquidityUsdc: liquidity, updatedAtMs: t,
  });
  out.push({
    from: token, to: "USDC", venueId,
    rate: price, feeBps, liquidityUsdc: liquidity, updatedAtMs: t,
  });
}

function edgesFromHl(q: HlQuotes): PriceEdge[] {
  const out: PriceEdge[] = [];
  pushPair(out, "ETH", q.ETH, "hl", HL_FEE_BPS, HL_LIQUIDITY_USDC, q.fetchedAtMs);
  pushPair(out, "BTC", q.BTC, "hl", HL_FEE_BPS, HL_LIQUIDITY_USDC, q.fetchedAtMs);
  pushPair(out, "SOL", q.SOL, "hl", HL_FEE_BPS, HL_LIQUIDITY_USDC, q.fetchedAtMs);
  return out;
}

function edgesFromBinance(q: BinanceQuotes): PriceEdge[] {
  const out: PriceEdge[] = [];
  pushPair(out, "ETH", q.ETH, "binance", BINANCE_FEE_BPS, BINANCE_LIQUIDITY_USDC, q.fetchedAtMs);
  pushPair(out, "BTC", q.BTC, "binance", BINANCE_FEE_BPS, BINANCE_LIQUIDITY_USDC, q.fetchedAtMs);
  pushPair(out, "SOL", q.SOL, "binance", BINANCE_FEE_BPS, BINANCE_LIQUIDITY_USDC, q.fetchedAtMs);
  pushPair(out, "EURC", q.EUR, "binance", BINANCE_FEE_BPS, BINANCE_LIQUIDITY_USDC, q.fetchedAtMs);
  return out;
}

function edgesFromChainlink(q: ChainlinkQuotes): PriceEdge[] {
  const out: PriceEdge[] = [];
  pushPair(out, "ETH", q.ETH, "chainlink", CHAINLINK_FEE_BPS, CHAINLINK_LIQUIDITY_USDC, q.fetchedAtMs);
  pushPair(out, "BTC", q.BTC, "chainlink", CHAINLINK_FEE_BPS, CHAINLINK_LIQUIDITY_USDC, q.fetchedAtMs);
  pushPair(out, "EURC", q.EUR, "chainlink", CHAINLINK_FEE_BPS, CHAINLINK_LIQUIDITY_USDC, q.fetchedAtMs);
  return out;
}
