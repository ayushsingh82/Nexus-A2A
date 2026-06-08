import { refreshLiveEdges } from "@/venues/refresh";
import { findNegativeCycles, sizeCycle } from "./search";
import type {
  Execution,
  Opportunity,
  PriceEdge,
  SwarmKpis,
  Treasury,
  Venue,
} from "./types";

/**
 * In-memory swarm store. Singleton across module reloads via globalThis.
 *
 * Cold-start: empty edges/opportunities/executions/KPIs. First call to
 * `runScan()` populates everything from real Hyperliquid + Binance prices.
 *
 * Treasury starts pre-funded with synthesized USDC distributed across venues —
 * clearly labeled as "synthesized" in the dashboard until Phase 5 wires
 * Circle Wallets and the balances become real.
 */

type Store = {
  venues: Venue[];
  edges: PriceEdge[];
  opportunities: Opportunity[];
  executions: Execution[];
  treasury: Treasury;
  kpis: SwarmKpis;
};

const KEY = "__argo_store__" as const;
const IDLE_THRESHOLD = 28_000;

function getStore(): Store {
  const g = globalThis as unknown as Record<string, Store | undefined>;
  if (!g[KEY]) {
    g[KEY] = createSeed();
  }
  return g[KEY]!;
}

// --- public reads ----------------------------------------------------------

export function listVenues(): Venue[] {
  return getStore().venues;
}

export function listEdges(): PriceEdge[] {
  return getStore().edges;
}

export function listOpportunities(limit = 12): Opportunity[] {
  return getStore().opportunities.slice(0, limit);
}

export function listExecutions(limit = 12): Execution[] {
  return getStore().executions.slice(0, limit);
}

export function getTreasury(): Treasury {
  return {
    ...getStore().treasury,
    usdcByVenue: { ...getStore().treasury.usdcByVenue },
  };
}

export function getKpis(): SwarmKpis {
  return { ...getStore().kpis };
}

// --- scan ------------------------------------------------------------------

/**
 * Run one scan tick:
 *   1. fetch live mids from Hyperliquid + Binance (public, no auth)
 *   2. rebuild the price-edge graph from real data
 *   3. run Bellman-Ford negative-cycle search
 *   4. rebuild the opportunity queue
 *   5. opportunistically synthesize an Execution for the top cycle
 *      (real fills land in Phase 5 once Circle Wallets are funded)
 */
export async function runScan(): Promise<{
  scanned: number;
  cyclesAboveThreshold: number;
  executed?: Execution;
  venuesOk: { hyperliquid: boolean; binance: boolean; chainlink: boolean };
  edgeCount: number;
}> {
  const store = getStore();

  // 1-2. live refresh from real venues
  const refresh = await refreshLiveEdges();
  if (refresh.edges.length > 0) {
    store.edges = refresh.edges;
  } else {
    console.warn(
      "argo scan: both venue fetches failed, keeping last-known edges",
    );
  }

  // 3. find cycles
  const cycles = findNegativeCycles(store.edges, { minNetBps: 5, topN: 6 });
  const now = Date.now();

  // 4. rebuild opportunity queue
  store.opportunities = cycles.map((c, i) => ({
    id: `OPP-${(now / 1000).toFixed(0).slice(-4)}${i}`,
    createdAtMs: now,
    cycle: c,
    sizeUsdc: round(sizeCycle(c, store.treasury.usdcWorking), 2),
    expectedProfitUsdc: round(
      sizeCycle(c, store.treasury.usdcWorking) * (c.netBps / 10_000),
      2,
    ),
    status: i === 0 ? "executing" : i < 2 ? "queued" : "candidate",
  }));

  store.kpis.opportunitiesScanned += 1;
  store.kpis.cyclesAboveThreshold = cycles.length;
  store.kpis.lastScanAtMs = now;

  // 5. opportunistic execute (synthesized fill — real fills in Phase 5)
  let executed: Execution | undefined;
  if (cycles.length > 0) {
    const top = cycles[0];
    const size = sizeCycle(top, store.treasury.usdcWorking);
    if (size > 0 && Math.random() < 0.92) {
      const slippage = (Math.random() - 0.5) * 0.0002; // ±2 bps
      const realizedBps = top.netBps + slippage * 10_000;
      const realizedUsdc = round(size * (realizedBps / 10_000), 2);
      executed = {
        id: `EX-${(now / 1000).toFixed(0).slice(-5)}`,
        opportunityId: store.opportunities[0]?.id ?? "OPP-?",
        atMs: now,
        cycleString: top.nodes.join("→"),
        venueString: top.edges.map((e) => e.venueId).join(" ▸ "),
        sizeUsdc: round(size, 2),
        realizedUsdc,
        netBps: round(realizedBps, 1),
        latencyMs: 320 + Math.floor(Math.random() * 280),
        txHash: fakeTxHash(),
        success: realizedUsdc >= 0,
      };
      store.executions.unshift(executed);
      if (store.executions.length > 200) store.executions.pop();

      store.kpis.opportunitiesCaptured += 1;
      store.kpis.totalProfitUsdc = round(
        store.kpis.totalProfitUsdc + realizedUsdc,
        2,
      );
      store.kpis.totalVolumeUsdc = round(
        store.kpis.totalVolumeUsdc + size,
        2,
      );
      store.kpis.avgLatencyMs = Math.round(
        (store.kpis.avgLatencyMs * (store.kpis.opportunitiesCaptured - 1) +
          executed.latencyMs) /
          store.kpis.opportunitiesCaptured,
      );
      const wins = store.executions.filter((e) => e.success).length;
      store.kpis.successRate = round(wins / store.executions.length, 3);

      // settle: realized PnL flows back to working USDC; sweep idle to USYC
      store.treasury.usdcWorking = round(
        store.treasury.usdcWorking + realizedUsdc,
        2,
      );
      if (store.treasury.usdcWorking > IDLE_THRESHOLD) {
        const sweep = round(store.treasury.usdcWorking - IDLE_THRESHOLD, 2);
        store.treasury.usdcWorking -= sweep;
        store.treasury.usycParked = round(
          store.treasury.usycParked + sweep,
          2,
        );
      }
    }
  }

  return {
    scanned: 1,
    cyclesAboveThreshold: cycles.length,
    executed,
    venuesOk: refresh.ok,
    edgeCount: store.edges.length,
  };
}

// --- helpers / seed --------------------------------------------------------

function fakeTxHash(): string {
  let h = "0x";
  for (let i = 0; i < 6; i++) {
    h += Math.floor(Math.random() * 16).toString(16);
  }
  return h + "…";
}

function round(n: number, dp = 2): number {
  const m = Math.pow(10, dp);
  return Math.round(n * m) / m;
}

/**
 * Cold-start seed: empty signal layer, pre-funded treasury (synthesized).
 *
 * On first `/api/scan`, edges + opportunities + executions populate from
 * real Hyperliquid + Binance prices.
 */
function createSeed(): Store {
  const venues: Venue[] = [
    { id: "hl",        name: "Hyperliquid", chain: "HL",  kind: "PERP" },
    { id: "binance",   name: "Binance",     chain: "CEX", kind: "CEX"  },
    { id: "chainlink", name: "Chainlink",   chain: "ETH", kind: "DEX"  },
  ];

  const treasury: Treasury = {
    usdcWorking: 30_000,
    usycParked: 0,
    eurcWorking: 0,
    usdcByVenue: {
      hl: 12_000,
      binance: 12_000,
      chainlink: 6_000,
    },
  };

  const kpis: SwarmKpis = {
    opportunitiesScanned: 0,
    opportunitiesCaptured: 0,
    totalProfitUsdc: 0,
    totalVolumeUsdc: 0,
    avgLatencyMs: 0,
    successRate: 0,
    lastScanAtMs: 0,
    cyclesAboveThreshold: 0,
  };

  return {
    venues,
    edges: [],
    opportunities: [],
    executions: [],
    treasury,
    kpis,
  };
}
