import type { Cycle, PriceEdge, Token } from "./types";

/**
 * Bellman-Ford negative-cycle detection on a directed weighted graph.
 *
 * Edge weight = -ln(rate × (1 − fee)).
 * A negative-sum cycle in this graph == a profitable arbitrage cycle:
 *   ∏ (rate_i × (1 − fee_i)) > 1
 *
 * We return *all* distinct cycles whose net profit (in bps after fees) clears
 * `minNetBps`, ranked by net bps descending. Each cycle is also annotated with
 * its liquidity floor so the sizing layer can clamp against the bottleneck.
 */

const MIN_NET_BPS_DEFAULT = 5; // 5 basis points = 0.05%

export type SearchOptions = {
  minNetBps?: number;
  /** cap on the number of cycles returned (top-N by netBps) */
  topN?: number;
};

export function findNegativeCycles(
  edges: PriceEdge[],
  opts: SearchOptions = {},
): Cycle[] {
  const minNetBps = opts.minNetBps ?? MIN_NET_BPS_DEFAULT;
  const topN = opts.topN ?? 10;

  const nodes = collectNodes(edges);
  if (nodes.length === 0) return [];

  const cycles: Cycle[] = [];
  const seenSigs = new Set<string>();

  for (const source of nodes) {
    const cycle = relaxFromSource(source, nodes, edges);
    if (!cycle) continue;
    const sig = cycleSignature(cycle);
    if (seenSigs.has(sig)) continue;
    seenSigs.add(sig);
    if (cycle.netBps >= minNetBps) cycles.push(cycle);
  }

  cycles.sort((a, b) => b.netBps - a.netBps);
  return cycles.slice(0, topN);
}

function collectNodes(edges: PriceEdge[]): Token[] {
  const set = new Set<Token>();
  for (const e of edges) {
    set.add(e.from);
    set.add(e.to);
  }
  return Array.from(set);
}

function edgeWeight(e: PriceEdge): number {
  // Effective rate per unit, after fees
  const eff = e.rate * (1 - e.feeBps / 10_000);
  if (eff <= 0) return Number.POSITIVE_INFINITY;
  return -Math.log(eff);
}

function relaxFromSource(
  source: Token,
  nodes: Token[],
  edges: PriceEdge[],
): Cycle | null {
  const dist = new Map<Token, number>();
  const prev = new Map<Token, { node: Token; edge: PriceEdge } | null>();

  for (const n of nodes) {
    dist.set(n, Number.POSITIVE_INFINITY);
    prev.set(n, null);
  }
  dist.set(source, 0);

  let updatedNode: Token | null = null;
  for (let i = 0; i < nodes.length; i++) {
    updatedNode = null;
    for (const e of edges) {
      const du = dist.get(e.from)!;
      const dv = dist.get(e.to)!;
      const w = edgeWeight(e);
      if (du + w < dv - 1e-12) {
        dist.set(e.to, du + w);
        prev.set(e.to, { node: e.from, edge: e });
        updatedNode = e.to;
      }
    }
    // If still updating on the nth iteration, we have a negative cycle reachable from source.
    if (i === nodes.length - 1 && updatedNode !== null) {
      return buildCycle(updatedNode, nodes.length, prev);
    }
  }
  return null;
}

function buildCycle(
  startCandidate: Token,
  hops: number,
  prev: Map<Token, { node: Token; edge: PriceEdge } | null>,
): Cycle | null {
  // Walk back n times to guarantee we are inside the cycle.
  let cur: Token = startCandidate;
  for (let i = 0; i < hops; i++) {
    const p = prev.get(cur);
    if (!p) return null;
    cur = p.node;
  }
  // Now `cur` is on the cycle. Walk back collecting nodes + edges until we close the loop.
  const nodes: Token[] = [];
  const edges: PriceEdge[] = [];
  const cycleStart = cur;
  let node: Token = cur;
  do {
    const p = prev.get(node);
    if (!p) return null;
    nodes.push(node);
    edges.push(p.edge);
    node = p.node;
  } while (node !== cycleStart);
  nodes.push(cycleStart);

  // Currently nodes/edges are in reverse traversal order (we walked back via prev).
  nodes.reverse();
  edges.reverse();

  if (nodes[0] !== nodes[nodes.length - 1]) {
    // Defensive — should be closed by construction.
    nodes.push(nodes[0]);
  }

  const grossMult = edges.reduce(
    (acc, e) => acc * e.rate * (1 - e.feeBps / 10_000),
    1,
  );
  const netBps = Math.round((grossMult - 1) * 10_000 * 10) / 10;
  const liquidityFloorUsdc = edges.reduce(
    (m, e) => Math.min(m, e.liquidityUsdc),
    Number.POSITIVE_INFINITY,
  );

  return { nodes, edges, netBps, liquidityFloorUsdc };
}

function cycleSignature(c: Cycle): string {
  // Rotate so the smallest token starts; gives a canonical key independent of starting point.
  const ring = c.nodes.slice(0, -1); // drop trailing duplicate
  let minIdx = 0;
  for (let i = 1; i < ring.length; i++) if (ring[i] < ring[minIdx]) minIdx = i;
  const rotated = [...ring.slice(minIdx), ...ring.slice(0, minIdx)];
  return rotated.join("→") + "|" + c.edges.map((e) => e.venueId).join(",");
}

/**
 * Cost-honest position sizer.
 *
 * Kelly-bounded fraction of bankroll, capped by:
 *   - per-edge liquidity floor (10% of bottleneck)
 *   - hard size cap from config
 */
export function sizeCycle(
  cycle: Cycle,
  bankrollUsdc: number,
  opts: { maxFraction?: number; liquidityFraction?: number; hardCap?: number } = {},
): number {
  const maxFraction = opts.maxFraction ?? 0.1; // never risk more than 10% of bankroll on one cycle
  const liquidityFraction = opts.liquidityFraction ?? 0.1; // never take more than 10% of the bottleneck
  const hardCap = opts.hardCap ?? 25_000;
  const liquidityCap = cycle.liquidityFloorUsdc * liquidityFraction;
  return Math.max(0, Math.min(bankrollUsdc * maxFraction, liquidityCap, hardCap));
}
