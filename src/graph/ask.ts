import {
  getKpis,
  getTreasury,
  listEdges,
  listOpportunities,
  listVenues,
} from "./store";
import type { PriceEdge, Token } from "./types";

export type AskAnswer = {
  question: string;
  /** direct, one-paragraph answer */
  thesis: string;
  /** supporting bullets */
  points: string[];
  /** the live numbers the answer is grounded in */
  evidence: { label: string; value: string }[];
  /** editable follow-up suggestions (free-form, not forced) */
  related: string[];
  asOfMs: number;
};

const TOKENS: Token[] = ["USDC", "EURC", "ETH", "BTC", "SOL"];

/**
 * Open-ended Q&A over the live swarm. Anyone can ask anything — the answer is
 * computed from the current in-memory state (edges, cycles, treasury, KPIs),
 * so it is never a fixed/canned string. Heuristic intent routing keeps it
 * dependency-free; every branch is grounded in real numbers.
 */
export function answerSwarm(questionRaw: string): AskAnswer {
  const question = questionRaw.trim();
  const q = question.toLowerCase();

  const kpis = getKpis();
  const treasury = getTreasury();
  const venues = listVenues();
  const edges = listEdges();
  const opps = listOpportunities(20);

  const tokens = uniqueTokens(edges);
  const lastScan = kpis.lastScanAtMs ? `${secsAgo(kpis.lastScanAtMs)}s ago` : "not yet";

  // global evidence attached to most answers
  const baseEvidence: { label: string; value: string }[] = [
    { label: "edges in graph", value: String(edges.length) },
    { label: "cycles ≥ 5 bps", value: String(kpis.cyclesAboveThreshold) },
    { label: "last scan", value: lastScan },
  ];

  const has = (...kw: string[]) => kw.some((k) => q.includes(k));
  const mentionedToken = TOKENS.find((t) => q.includes(t.toLowerCase()));

  // ── empty state ───────────────────────────────────────────────
  if (edges.length === 0) {
    return {
      question,
      thesis:
        "The graph is empty right now — no live edges have been fetched yet. Run a capture cycle (or turn on Autopilot) and I'll have real venue prices to reason over.",
      points: [
        "I answer from the swarm's live state: edges, negative cycles, treasury and execution receipts.",
        "Once a scan lands, ask me about the best cycle, a specific token, the treasury, or why nothing is firing.",
      ],
      evidence: baseEvidence,
      related: ["What is the best cycle right now?", "How does Argo find arbitrage?", "Show me the treasury"],
      asOfMs: Date.now(),
    };
  }

  // ── token-specific ────────────────────────────────────────────
  if (mentionedToken && has(mentionedToken.toLowerCase())) {
    const tok = mentionedToken;
    const involved = edges.filter((e) => e.from === tok || e.to === tok);
    if (involved.length > 0) {
      const out = bestQuote(involved.filter((e) => e.from === tok));
      const intoUsdc = involved.find((e) => e.from === tok && e.to === "USDC");
      const points = [
        `${tok} appears in ${involved.length} live edge${involved.length === 1 ? "" : "s"} across ${new Set(involved.map((e) => e.venueId)).size} venue${new Set(involved.map((e) => e.venueId)).size === 1 ? "" : "s"}.`,
      ];
      if (out) {
        points.push(
          `Best outbound quote: 1 ${tok} → ${fmt(out.rate)} ${out.to} on ${out.venueId} (fee ${out.feeBps} bps, liq $${out.liquidityUsdc.toLocaleString()}).`,
        );
      }
      const inCycle = opps.find((o) => o.cycle.nodes.includes(tok));
      if (inCycle) {
        points.push(
          `${tok} is part of a live cycle: ${inCycle.cycle.nodes.join(" → ")} at +${inCycle.cycle.netBps.toFixed(1)} bps.`,
        );
      } else {
        points.push(`No profitable cycle currently routes through ${tok} above the 5 bps threshold.`);
      }
      return {
        question,
        thesis: `Here's what the swarm sees for ${tok} right now, from live venue prices.`,
        points,
        evidence: [
          { label: `${tok} edges`, value: String(involved.length) },
          ...(intoUsdc ? [{ label: `${tok}→USDC`, value: fmt(intoUsdc.rate) }] : []),
          ...baseEvidence,
        ],
        related: [`Is there a cycle through ${tok}?`, "What is the best cycle right now?", "Which venue has the most edges?"],
        asOfMs: Date.now(),
      };
    }
  }

  // ── best opportunity / cycle ──────────────────────────────────
  if (has("best", "opportunit", "arb", "cycle", "trade", "profitable", "right now", "anything")) {
    const top = opps[0];
    if (top) {
      return {
        question,
        thesis: `The best live cycle is ${top.cycle.nodes.join(" → ")} at +${top.cycle.netBps.toFixed(1)} bps net of fees — expected +$${top.expectedProfitUsdc.toFixed(2)} on a $${top.sizeUsdc.toLocaleString()} clip.`,
        points: [
          `Routed via ${top.cycle.edges.map((e) => e.venueId).join(" ▸ ")}.`,
          `Liquidity floor across the loop is $${top.cycle.liquidityFloorUsdc.toLocaleString()} — that caps the Kelly size.`,
          `Status: ${top.status}. ${kpis.cyclesAboveThreshold} cycle${kpis.cyclesAboveThreshold === 1 ? "" : "s"} currently clear the 5 bps threshold.`,
        ],
        evidence: [
          { label: "net bps", value: `+${top.cycle.netBps.toFixed(1)}` },
          { label: "expected", value: `+$${top.expectedProfitUsdc.toFixed(2)}` },
          { label: "size", value: `$${top.sizeUsdc.toLocaleString()}` },
          ...baseEvidence,
        ],
        related: ["Why is this profitable?", "Show me the treasury", "Which venues are in the loop?"],
        asOfMs: Date.now(),
      };
    }
    return {
      question,
      thesis: `No cycle clears the 5 bps threshold this tick — real spot markets are efficient most of the time. The swarm is holding ${edges.length} live edges and re-checking every scan.`,
      points: [
        "Argo is cost-honest: it only fires when a closed loop nets ≥ 5 bps after fees and slippage.",
        "When nothing qualifies, idle USDC parks in USYC for yield instead of forcing a bad trade.",
        `Last scan ${lastScan}; ${kpis.opportunitiesScanned.toLocaleString()} scans run since launch.`,
      ],
      evidence: baseEvidence,
      related: ["Why are there no opportunities?", "How does Argo find arbitrage?", "Where is idle capital parked?"],
      asOfMs: Date.now(),
    };
  }

  // ── profit / pnl ──────────────────────────────────────────────
  if (has("profit", "pnl", "earn", "made", "money", "captured", "return", "performance")) {
    return {
      question,
      thesis: `The swarm has captured $${kpis.totalProfitUsdc.toFixed(2)} in realized PnL across ${kpis.opportunitiesCaptured} settled cycle${kpis.opportunitiesCaptured === 1 ? "" : "s"}, at a ${(kpis.successRate * 100).toFixed(0)}% success rate.`,
      points: [
        `Total volume routed: $${kpis.totalVolumeUsdc.toLocaleString()}.`,
        `Average execution latency first-leg → settle on Arc: ${kpis.avgLatencyMs}ms.`,
        "Every capture is an onchain receipt on Arc — see the Executions page.",
      ],
      evidence: [
        { label: "net profit", value: `$${kpis.totalProfitUsdc.toFixed(2)}` },
        { label: "captures", value: String(kpis.opportunitiesCaptured) },
        { label: "success", value: `${(kpis.successRate * 100).toFixed(0)}%` },
        { label: "volume", value: `$${kpis.totalVolumeUsdc.toLocaleString()}` },
      ],
      related: ["What is the best cycle right now?", "How fast does it settle?", "Show me the treasury"],
      asOfMs: Date.now(),
    };
  }

  // ── treasury / capital / yield ────────────────────────────────
  if (has("treasury", "balance", "capital", "usyc", "eurc", "fund", "park", "yield", "idle")) {
    const total = treasury.usdcWorking + treasury.usycParked + treasury.eurcWorking;
    return {
      question,
      thesis: `Unified treasury is $${total.toLocaleString()} via Circle Gateway: $${treasury.usdcWorking.toLocaleString()} working USDC, $${treasury.usycParked.toLocaleString()} parked in USYC for yield, $${treasury.eurcWorking.toLocaleString()} EURC.`,
      points: [
        "Gateway gives one unified balance — no need to pre-fund each venue separately.",
        "When no cycle clears the threshold, idle USDC sweeps into USYC so capital never sits dead.",
        `Working USDC is spread across ${Object.keys(treasury.usdcByVenue).length} venues.`,
      ],
      evidence: [
        { label: "unified", value: `$${total.toLocaleString()}` },
        { label: "working USDC", value: `$${treasury.usdcWorking.toLocaleString()}` },
        { label: "USYC", value: `$${treasury.usycParked.toLocaleString()}` },
        { label: "EURC", value: `$${treasury.eurcWorking.toLocaleString()}` },
      ],
      related: ["Why park in USYC?", "What is the best cycle right now?", "How much profit so far?"],
      asOfMs: Date.now(),
    };
  }

  // ── venues ────────────────────────────────────────────────────
  if (has("venue", "exchange", "hyperliquid", "binance", "chainlink", "where", "which")) {
    const byVenue = countByVenue(edges);
    return {
      question,
      thesis: `Argo monitors ${venues.length} venues: ${venues.map((v) => `${v.name} (${v.kind})`).join(", ")}. The live graph has ${edges.length} edges across them.`,
      points: venues.map((v) => `${v.name} · ${v.chain.toLowerCase()} · ${byVenue[v.id] ?? 0} edge${(byVenue[v.id] ?? 0) === 1 ? "" : "s"} in the current graph.`),
      evidence: [
        { label: "venues", value: String(venues.length) },
        ...baseEvidence,
      ],
      related: ["Which venue has the best ETH quote?", "What is the best cycle right now?", "How does Argo find arbitrage?"],
      asOfMs: Date.now(),
    };
  }

  // ── speed / latency / arc ─────────────────────────────────────
  if (has("fast", "latency", "speed", "settle", "arc", "finality", "how long", "quick")) {
    return {
      question,
      thesis: `Average execution is ${kpis.avgLatencyMs}ms first-leg → settled on Arc, which gives sub-second finality at ~$0.01 per tx in USDC.`,
      points: [
        "Speed is the whole game: if settlement is slow the cycle vanishes and a leg is left stranded mid-route.",
        "Deterministic ordering on Arc makes the loop sandwich-resistant — it executes whole or not at all.",
        "Circle Gateway moves the unified USDC balance to the source venue in under 500ms; CCTP handles chain hops.",
      ],
      evidence: [
        { label: "avg latency", value: `${kpis.avgLatencyMs}ms` },
        { label: "finality", value: "sub-second" },
        { label: "per-tx", value: "~$0.01 USDC" },
      ],
      related: ["Why does Argo need Arc?", "How much profit so far?", "How does Argo find arbitrage?"],
      asOfMs: Date.now(),
    };
  }

  // ── how it works / strategy / risk ────────────────────────────
  if (has("how", "work", "strategy", "explain", "negative cycle", "bellman", "find", "detect", "risk", "liquidity", "kelly", "slippage", "size")) {
    return {
      question,
      thesis:
        "Argo treats prices as a directed graph: each edge weighted by −log(rate × (1 − fee)). A negative cycle in those weights is a closed loop where USDC comes back larger than it left — that's the arbitrage.",
      points: [
        "Bellman-Ford / SPFA surfaces every negative cycle each scan; only loops netting ≥ 5 bps after fees + slippage qualify.",
        "Sizing is Kelly-bounded and capped by the per-edge liquidity floor, so it never moves more than the thinnest hop can absorb.",
        "It routes USDC via Circle Gateway + CCTP, executes the legs in order, settles on Arc, and parks idle capital in USYC.",
        `Right now: ${edges.length} edges, ${kpis.cyclesAboveThreshold} cycle${kpis.cyclesAboveThreshold === 1 ? "" : "s"} above threshold, last scan ${lastScan}.`,
      ],
      evidence: baseEvidence,
      related: ["What is the best cycle right now?", "Why park idle capital in USYC?", "Which venues are monitored?"],
      asOfMs: Date.now(),
    };
  }

  // ── why nothing ───────────────────────────────────────────────
  if (has("why", "nothing", "empty", "zero", "no ")) {
    return {
      question,
      thesis: `${kpis.cyclesAboveThreshold === 0 ? "Nothing is firing because no closed loop currently nets ≥ 5 bps after fees + slippage" : `${kpis.cyclesAboveThreshold} cycle(s) are live`} — Argo is deliberately cost-honest and won't force a losing trade.`,
      points: [
        "Spot markets are efficient most of the time; real edges are small and fleeting.",
        "The 5 bps threshold already nets out venue fees and expected slippage, so a 'tiny' spread isn't actually profitable.",
        "While it waits, capital isn't idle — it earns yield in USYC.",
      ],
      evidence: baseEvidence,
      related: ["What is the best cycle right now?", "How does Argo find arbitrage?", "Where is idle capital parked?"],
      asOfMs: Date.now(),
    };
  }

  // ── fallback: live status + invite (still dynamic) ────────────
  return {
    question,
    thesis: `I don't have a specific read on that, but here's the swarm right now: ${edges.length} live edges across ${venues.length} venues, ${kpis.cyclesAboveThreshold} cycle${kpis.cyclesAboveThreshold === 1 ? "" : "s"} above the 5 bps threshold, $${kpis.totalProfitUsdc.toFixed(2)} captured so far.`,
    points: [
      "Ask me about the best cycle, a specific token (USDC, ETH, BTC, SOL, EURC), the treasury, the venues, latency, or how the strategy works.",
      `Tokens currently in the graph: ${tokens.join(", ") || "none yet"}.`,
    ],
    evidence: baseEvidence,
    related: ["What is the best cycle right now?", "Show me the treasury", "How does Argo find arbitrage?"],
    asOfMs: Date.now(),
  };
}

// ── helpers ────────────────────────────────────────────────────
function uniqueTokens(edges: PriceEdge[]): Token[] {
  const s = new Set<Token>();
  for (const e of edges) {
    s.add(e.from);
    s.add(e.to);
  }
  return [...s];
}

function countByVenue(edges: PriceEdge[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const e of edges) m[e.venueId] = (m[e.venueId] ?? 0) + 1;
  return m;
}

function bestQuote(edges: PriceEdge[]): PriceEdge | undefined {
  if (edges.length === 0) return undefined;
  return [...edges].sort((a, b) => b.rate - a.rate)[0];
}

function fmt(n: number): string {
  return n >= 1
    ? n.toLocaleString(undefined, { maximumFractionDigits: 4 })
    : n.toExponential(4);
}

function secsAgo(ms: number): number {
  return Math.max(0, Math.round((Date.now() - ms) / 1000));
}
