import { NextResponse } from "next/server";
import { runScan } from "@/graph/store";

export const dynamic = "force-dynamic";

/**
 * POST /api/scan
 *
 * Runs one scan tick on **live, real venue prices**:
 *   - fetches mids from Hyperliquid (public, no auth)
 *   - fetches tickers from Binance (public, no auth)
 *   - rebuilds the price-edge graph from real data
 *   - runs negative-cycle search (Bellman-Ford on -log(rate × (1 − fees)))
 *   - rebuilds the opportunity queue
 *   - opportunistically executes the top cycle (synthesised fill until Circle wallets land)
 */
export async function POST() {
  const summary = await runScan();
  return NextResponse.json({ ok: true, ...summary });
}
