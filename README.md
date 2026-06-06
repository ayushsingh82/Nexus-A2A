# Argo

> Cross-venue arbitrage agent. One graph. Real USDC. Settled on Arc.

Argo maintains a live price graph across spot DEXs, CEXs, and chains. It runs continuous **negative-cycle detection** to find closed loops where capital comes back larger than it started. When one clears 5 bps net of fees + slippage, Argo sizes it against per-edge liquidity, routes USDC through **Circle Gateway + CCTP**, and settles on **Arc**. Idle capital parks in **USYC** for yield between captured arbs.

## Why it can only run here

| | |
|---|---|
| **Sub-second finality** | Without it, the cycle vanishes during settlement and the leg is stranded mid-route. |
| **~$0.01 per-tx in USDC** | Without it, per-route economics never close at retail size. |
| **Deterministic ordering** | Sandwich-resistant by construction — cycle executes whole or not at all. |
| **Native USDC settlement** | Currency = the asset, no conversion overhead. |

## How it works

```
ingest → reason → size → route → execute → park
  ↑                                            │
  └────────────────────────────────────────────┘
                  every 500ms
```

1. **Ingest** mids from Hyperliquid, Uniswap (Eth/Base/Arb), Curve, public CEX feeds
2. **Reason** via Bellman-Ford / SPFA over `-log(rate × (1 − fees))`
3. **Size** Kelly-bounded, capped at 10% of liquidity floor + hard cap
4. **Route** Gateway moves USDC to source venue in <500ms; CCTP for chain hops
5. **Execute** legs in deterministic order on Arc; record onchain receipt
6. **Park** idle USDC sweeps into USYC for yield

## Circle stack — all eight load-bearing

| Product | Role |
|---|---|
| **Wallets** | One Circle Wallet per venue |
| **USDC** | Working capital + settlement |
| **EURC** | FX-aware graph nodes (only EURC arb actually viable) |
| **USYC** | Idle treasury parks here for yield |
| **Gateway** | Sub-500ms cross-chain — the speed mechanism |
| **CCTP** | Native USDC bridges |
| **Paymaster** | All gas in USDC — clean per-route PnL |
| **Contracts** | RouteRegistry on Arc — every arb is an onchain receipt |

## Tech

Next.js 16 · TypeScript · Tailwind 4 · Anthropic SDK · viem · `@circle-fin/developer-controlled-wallets` · Foundry (contracts) · Hyperliquid + Uniswap V3 + Curve clients

## Run locally

```bash
git clone https://github.com/ayushsingh82/Argo.git
cd Argo
npm install
npm run dev
```

Open `http://localhost:3000` for the marketing landing, `/dashboard` for the live agent.

## API surface

| Endpoint | Returns |
|---|---|
| `GET /api/kpis` | swarm KPIs (opportunities scanned/captured, profit, latency, success rate) |
| `GET /api/opportunities` | live cycle candidates above 5 bps |
| `GET /api/executions` | recent onchain receipts |
| `GET /api/treasury` | unified balance + per-venue working USDC + USYC |
| `GET /api/venues` | nodes + edges in the live graph |
| `POST /api/scan` | trigger one scan tick (jitter prices → search → maybe execute) |

## Status

Phase 2 (backend) live. Next: Phase 3 venue clients (Hyperliquid public mids, Uniswap V3 QuoterV2, Curve), Phase 4 executor + reasoning, Phase 5 Circle wallets per venue. See [pending.md](./pending.md).

## Hackathon

Built for the [Agora Agents Hackathon](./hackathon.md) — Canteen × Circle × Arc, RFB 05 (Cross-Platform Arbitrage Agent).
