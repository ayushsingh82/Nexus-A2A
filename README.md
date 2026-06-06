# Argo — Cross-Venue Arbitrage Agent

A single autonomous agent that maintains a live price graph across spot DEXs and CEXs across multiple chains, hunts for **negative cycles** (closed loops where capital comes back larger than it started), routes USDC through the optimal path via Circle Gateway + CCTP, and parks idle capital in USYC between opportunities.

One agent. One graph. Real USDC. Settled on Arc.

---

## The problem

Price discrepancies across venues and chains exist constantly — but each one disappears in seconds. Capturing them requires four things at once:

1. **Real-time price data** from every relevant venue
2. **Graph reasoning** to spot multi-hop arbitrage that humans miss
3. **Sub-second execution** before the spread vanishes
4. **Cost-honest accounting** so you only execute when *net* of fees and slippage you actually win

Most arb bots today do one or two of these. The ones that do all four are quiet because they make money quietly.

## The solution

Argo treats every venue as a node and every tradeable pair as a weighted edge in a directed graph. The agent runs continuous negative-cycle detection (Bellman-Ford / SPFA over log-prices) to find closed loops where:

```
∏ (1 + r_i) × (1 − fees_i − slippage_i) > 1
```

When a cycle exists with positive net edge after costs, Argo:

1. **Sizes** the trade against per-edge liquidity (Kelly-bounded, capped by available USDC at the source venue)
2. **Routes** capital via Circle Gateway (sub-500ms cross-chain unified balance) and CCTP where chain hops are required
3. **Executes** the legs in deterministic order on Arc
4. **Settles** profit back to the parent vault and parks idle capital in USYC

When no profitable cycle exists, idle USDC sits in **USYC** earning yield. The treasury never sleeps.

## Why Arc is load-bearing

Argo cannot run profitably on any other settlement substrate:

- **Sub-second deterministic finality** — without it, the cycle vanishes during settlement
- **~$0.01 per-tx fees in USDC** — without it, per-route economics never close at retail size
- **Deterministic ordering** — execution is sandwich-resistant by construction
- **Native USDC** — settlement currency = the asset you're arbitraging, no conversion overhead

## Circle stack — what's load-bearing

| Product | Function |
|---|---|
| **USDC** | Working capital and settlement leg of every route |
| **EURC** | FX-aware nodes in the price graph (USDC↔EURC↔ETH triangles) |
| **USYC** | Idle treasury parks here for yield between captured arbs |
| **Wallets** | One Circle Wallet per venue, holding venue-specific working capital |
| **Gateway** | Unified USDC balance + sub-500ms cross-chain — the speed mechanism the whole product depends on |
| **CCTP** | Native USDC cross-chain settlement for routes that span chains |
| **Paymaster** | All gas paid in USDC so per-route PnL accounting stays clean |
| **Contracts** | RouteRegistry on Arc — every captured arb is an onchain receipt |
| **App Kit** | Unified Balance dashboard component for treasury view |

## How the agent decides

```
┌─────────────────────────────────────────────────────────┐
│                       ARGO AGENT                        │
│                                                          │
│   tick (sub-second):                                    │
│    1. ingest mid prices from every monitored venue      │
│    2. update edge weights in the live price graph       │
│    3. run negative-cycle search (Bellman-Ford / SPFA)   │
│    4. for each candidate cycle:                         │
│         - compute net-of-cost PnL with live fees + book │
│         - rank by (expected PnL × probability of fill)  │
│    5. if top cycle clears threshold:                    │
│         - size against liquidity + bankroll             │
│         - route via Gateway / CCTP                      │
│         - execute legs in order                         │
│         - record onchain receipt                        │
│    6. if no cycle: park idle USDC in USYC               │
└─────────────────────────────────────────────────────────┘
```

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 16 (App Router) · TypeScript · Tailwind CSS · light SaaS app shell (sidebar + main) |
| Brand color | `#01B73E` (Jawstarter / SpendOS family) |
| Agent runtime | Node.js · TypeScript · Anthropic SDK (Claude Sonnet for cost/slippage reasoning) |
| Graph engine | Bellman-Ford + SPFA over log-prices |
| Onchain | Arc (Canteen testnet) · Circle Wallets · CCTP · Gateway · Paymaster |
| Smart contracts | Solidity · Foundry — RouteRegistry on Arc |
| Price oracles | Hyperliquid, Uniswap V3, Curve, public CEX websockets |

## Repo layout (planned)

```
argo/
├─ src/
│  ├─ app/                  # Next.js app shell (sidebar + dashboard)
│  ├─ components/           # Sidebar, header, primitives
│  ├─ graph/
│  │  ├─ types.ts           # Node, Edge, Cycle
│  │  ├─ build.ts           # construct graph from venue snapshots
│  │  └─ search.ts          # Bellman-Ford / SPFA negative cycle
│  ├─ venues/
│  │  ├─ hyperliquid.ts
│  │  ├─ uniswap.ts
│  │  ├─ curve.ts
│  │  └─ binance.ts         # public websocket only
│  ├─ executor/
│  │  ├─ size.ts            # Kelly-bounded sizing
│  │  ├─ route.ts           # Gateway / CCTP routing
│  │  └─ run.ts             # execute legs in order
│  └─ circle/               # wallets / gateway / cctp / paymaster / usyc
└─ contracts/
   └─ RouteRegistry.sol
```

## Status

Day 1. See [pending.md](./pending.md).
