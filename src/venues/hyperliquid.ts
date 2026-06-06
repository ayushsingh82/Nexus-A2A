/**
 * Hyperliquid public read-only client.
 * https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api
 *
 * No auth required for `info` endpoints.
 */

const HL_API = "https://api.hyperliquid.xyz/info";

export type HlMids = Record<string, number>;

export async function fetchHyperliquidMids(): Promise<HlMids> {
  const res = await fetch(HL_API, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "allMids" }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`hyperliquid ${res.status}: ${await res.text()}`);
  }
  const raw = (await res.json()) as Record<string, string>;
  const out: HlMids = {};
  for (const [k, v] of Object.entries(raw)) {
    const n = parseFloat(v);
    if (!Number.isNaN(n) && n > 0) out[k] = n;
  }
  return out;
}

/**
 * For the tokens we trade, return USDC-per-token mids (= mark prices).
 * Returns 0 if a symbol isn't quoted on HL.
 */
export type HlQuotes = {
  ETH: number;
  BTC: number;
  SOL: number;
  fetchedAtMs: number;
};

export async function fetchHlQuotes(): Promise<HlQuotes> {
  const mids = await fetchHyperliquidMids();
  return {
    ETH: mids.ETH ?? 0,
    BTC: mids.BTC ?? 0,
    SOL: mids.SOL ?? 0,
    fetchedAtMs: Date.now(),
  };
}
