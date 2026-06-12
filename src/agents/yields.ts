/**
 * Fetch real live yield rates from public APIs (no auth required).
 *
 * Aave v3 + Uniswap V3 — DeFiLlama yields API
 * Perp funding          — Hyperliquid info API (reused from venues/)
 */

export type LiveYields = {
  aaveApyBps: number;
  uniswapLpApyBps: number;
  perpFundingApyBps: number;
  ok: { defillama: boolean; hyperliquid: boolean };
};

export async function fetchLiveYields(): Promise<LiveYields> {
  const [defiLlama, hyperliquid] = await Promise.allSettled([
    fetchDefiLlamaYields(),
    fetchHyperliquidFundingApyBps(),
  ]);

  const dl = defiLlama.status === "fulfilled" ? defiLlama.value : null;
  const hl = hyperliquid.status === "fulfilled" ? hyperliquid.value : null;

  return {
    aaveApyBps: dl?.aaveApyBps ?? 520,
    uniswapLpApyBps: dl?.uniswapLpApyBps ?? 840,
    perpFundingApyBps: hl ?? 1120,
    ok: {
      defillama: dl !== null,
      hyperliquid: hl !== null,
    },
  };
}

async function fetchDefiLlamaYields(): Promise<{
  aaveApyBps: number;
  uniswapLpApyBps: number;
}> {
  const res = await fetch("https://yields.llama.fi/pools", {
    next: { revalidate: 120 },
  });
  if (!res.ok) throw new Error("defillama non-200");
  const json = await res.json();
  const pools: Array<{
    project: string;
    symbol: string;
    chain: string;
    apy?: number;
  }> = json.data ?? [];

  // Aave v3 USDC on Base or Ethereum — take highest APY match
  const aavePool = pools
    .filter(
      (p) =>
        p.project === "aave-v3" &&
        p.symbol?.toUpperCase().includes("USDC") &&
        (p.chain === "Base" || p.chain === "Ethereum"),
    )
    .sort((a, b) => (b.apy ?? 0) - (a.apy ?? 0))[0];

  // Uniswap V3 USDC/ETH on Ethereum
  const uniPool = pools
    .filter(
      (p) =>
        p.project === "uniswap-v3" &&
        p.symbol?.toUpperCase().includes("USDC") &&
        p.symbol?.toUpperCase().includes("ETH") &&
        p.chain === "Ethereum",
    )
    .sort((a, b) => (b.apy ?? 0) - (a.apy ?? 0))[0];

  return {
    aaveApyBps: aavePool?.apy ? Math.round(aavePool.apy * 100) : 520,
    uniswapLpApyBps: uniPool?.apy ? Math.round(uniPool.apy * 100) : 840,
  };
}

async function fetchHyperliquidFundingApyBps(): Promise<number> {
  const res = await fetch("https://api.hyperliquid.xyz/info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "metaAndAssetCtxs" }),
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("hl non-200");
  const [meta, assetCtxs] = await res.json();

  // BTC funding rate as a proxy for perp funding strategy
  const btcIdx: number = (
    meta?.universe as Array<{ name: string }> | undefined
  )?.findIndex((u) => u.name === "BTC") ?? -1;

  if (btcIdx >= 0 && assetCtxs?.[btcIdx]) {
    const hourlyRate = parseFloat(assetCtxs[btcIdx].funding ?? "0");
    // hourly → annualised bps (8760 hours/year)
    const annualisedBps = Math.round(Math.abs(hourlyRate) * 8760 * 10_000);
    // sanity-cap: 0–5000 bps (0–50% APY)
    if (annualisedBps > 0 && annualisedBps < 5000) return annualisedBps;
  }
  return 1120;
}
