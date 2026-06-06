import { fetchBinanceQuotes, type BinanceQuotes } from "./binance";
import { fetchHlQuotes, type HlQuotes } from "./hyperliquid";
import type { PriceEdge, Token } from "@/graph/types";

/**
 * Builds the live PriceEdge[] from real public venues.
 *
 * - Hyperliquid → USDC↔{ETH,BTC,SOL} edges (HL is USDC-quoted perp mid)
 * - Binance     → USDC↔{ETH,BTC,SOL,EURC} edges (USDT ≈ USDC for signal)
 *
 * Both fetches happen in parallel. If either fails, we still emit edges from
 * the venue that succeeded; if both fail, the caller falls back to seed.
 *
 * Fees are conservative venue defaults:
 *   HL perp taker:     ~3 bps  (treated as 5 bps to be safe)
 *   Binance spot taker: 10 bps
 * Liquidity is approximated by reasonable book depth at the top of book.
 */

const HL_FEE_BPS = 5;
const BINANCE_FEE_BPS = 10;

const HL_LIQUIDITY_USDC = 500_000;
const BINANCE_LIQUIDITY_USDC = 1_000_000;

export type RefreshResult = {
  edges: PriceEdge[];
  ok: { hyperliquid: boolean; binance: boolean };
  fetchedAtMs: number;
};

export async function refreshLiveEdges(): Promise<RefreshResult> {
  const [hlRes, bnRes] = await Promise.allSettled([
    fetchHlQuotes(),
    fetchBinanceQuotes(),
  ]);

  const edges: PriceEdge[] = [];
  const ok = {
    hyperliquid: hlRes.status === "fulfilled",
    binance: bnRes.status === "fulfilled",
  };

  if (hlRes.status === "fulfilled") {
    edges.push(...edgesFromHl(hlRes.value));
  }
  if (bnRes.status === "fulfilled") {
    edges.push(...edgesFromBinance(bnRes.value));
  }

  return {
    edges,
    ok,
    fetchedAtMs: Date.now(),
  };
}

function edgesFromHl(q: HlQuotes): PriceEdge[] {
  const out: PriceEdge[] = [];
  const t = q.fetchedAtMs;
  const push = (token: Token, price: number) => {
    if (price <= 0) return;
    out.push({
      from: "USDC", to: token, venueId: "hl",
      rate: 1 / price, feeBps: HL_FEE_BPS,
      liquidityUsdc: HL_LIQUIDITY_USDC, updatedAtMs: t,
    });
    out.push({
      from: token, to: "USDC", venueId: "hl",
      rate: price, feeBps: HL_FEE_BPS,
      liquidityUsdc: HL_LIQUIDITY_USDC, updatedAtMs: t,
    });
  };
  push("ETH", q.ETH);
  push("BTC", q.BTC);
  push("SOL", q.SOL);
  return out;
}

function edgesFromBinance(q: BinanceQuotes): PriceEdge[] {
  const out: PriceEdge[] = [];
  const t = q.fetchedAtMs;
  const push = (token: Token, price: number) => {
    if (price <= 0) return;
    out.push({
      from: "USDC", to: token, venueId: "binance",
      rate: 1 / price, feeBps: BINANCE_FEE_BPS,
      liquidityUsdc: BINANCE_LIQUIDITY_USDC, updatedAtMs: t,
    });
    out.push({
      from: token, to: "USDC", venueId: "binance",
      rate: price, feeBps: BINANCE_FEE_BPS,
      liquidityUsdc: BINANCE_LIQUIDITY_USDC, updatedAtMs: t,
    });
  };
  push("ETH", q.ETH);
  push("BTC", q.BTC);
  push("SOL", q.SOL);

  // EUR proxy → USDC↔EURC arb signal
  if (q.EUR > 0) {
    out.push({
      from: "USDC", to: "EURC", venueId: "binance",
      rate: 1 / q.EUR, feeBps: BINANCE_FEE_BPS,
      liquidityUsdc: BINANCE_LIQUIDITY_USDC, updatedAtMs: t,
    });
    out.push({
      from: "EURC", to: "USDC", venueId: "binance",
      rate: q.EUR, feeBps: BINANCE_FEE_BPS,
      liquidityUsdc: BINANCE_LIQUIDITY_USDC, updatedAtMs: t,
    });
  }
  return out;
}
