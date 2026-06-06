/**
 * Binance public price ticker.
 * https://binance-docs.github.io/apidocs/spot/en/#symbol-price-ticker
 *
 * No auth required for /api/v3/ticker/price.
 *
 * We treat USDT ≈ USDC for the purposes of cross-venue arb signal; the actual
 * USDC leg always settles via Circle on Arc. The "USDT" tickers here are a
 * read-only reference for what a CEX prices the asset at right now.
 */

const BINANCE_API = "https://api.binance.com/api/v3/ticker/price";

type BinanceTicker = { symbol: string; price: string };

const TRACKED_SYMBOLS = ["ETHUSDT", "BTCUSDT", "SOLUSDT", "EURUSDT"] as const;
type TrackedSymbol = (typeof TRACKED_SYMBOLS)[number];

export type BinanceQuotes = {
  ETH: number; // USDT per ETH
  BTC: number;
  SOL: number;
  EUR: number; // USDT per EUR (proxy for EURC↔USDC)
  fetchedAtMs: number;
};

export async function fetchBinanceQuotes(): Promise<BinanceQuotes> {
  // Request only the symbols we care about via the `symbols=[...]` param.
  const symbolsParam = encodeURIComponent(JSON.stringify(TRACKED_SYMBOLS));
  const url = `${BINANCE_API}?symbols=${symbolsParam}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`binance ${res.status}: ${await res.text()}`);
  }
  const raw = (await res.json()) as BinanceTicker[];
  const map: Record<string, number> = {};
  for (const t of raw) {
    const n = parseFloat(t.price);
    if (!Number.isNaN(n) && n > 0) map[t.symbol] = n;
  }
  return {
    ETH: map.ETHUSDT ?? 0,
    BTC: map.BTCUSDT ?? 0,
    SOL: map.SOLUSDT ?? 0,
    EUR: map.EURUSDT ?? 0,
    fetchedAtMs: Date.now(),
  };
}

export function priceFor(quotes: BinanceQuotes, sym: TrackedSymbol): number {
  switch (sym) {
    case "ETHUSDT": return quotes.ETH;
    case "BTCUSDT": return quotes.BTC;
    case "SOLUSDT": return quotes.SOL;
    case "EURUSDT": return quotes.EUR;
  }
}
