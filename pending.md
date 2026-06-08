# Build Checklist — Argo

Deadline: **May 25, 2026** · Today: **May 17** · **8 days remaining**

Legend: `[x]` shipped · `[~]` partial · `[ ]` not started · 🔥 = blocker

---

## ✅ Phase 0 — Setup & docs

- [x] Next.js 16 + Tailwind 4 + App Router at `/argo`
- [x] `hackathon.md`, `README.md`, `pending.md`
- [x] Git remote → `github.com/ayushsingh82/Argo`

## ✅ Phase 1 — Design system + landing + dashboard shell

- [x] SpendOS-cloned light theme, `#01B73E` green, EB Garamond not used (Allura cursive for wordmark instead)
- [x] App-shell: Sidebar (with Argo → `/` home link) + AppShellHeader
- [x] Marketing landing (`/`): hero with **PixelBlast WebGL green pixel-shader bg**, live ticker, agent loop (6 steps), why-Arc strip, Circle stack badge grid (with `critical / unique-to-circle / core` tags), final CTA
- [x] Dashboard (`/dashboard`): status strip with scan button, KPI tiles with sparklines, live opportunities with cycle visual, treasury panel with proportional bar + per-venue split, executions timeline, venues list with chips

## ✅ Phase 2 — Backend foundation (engine + APIs)

- [x] `src/graph/types.ts` — Node, Edge, Cycle, Opportunity, Execution, Treasury, KPIs
- [x] `src/graph/search.ts` — Bellman-Ford negative-cycle detection over `-log(rate × (1 − fees))`; Kelly + liquidity sizing
- [x] `src/graph/store.ts` — in-memory singleton + `runScan()` that jitters prices, re-searches, opportunistically executes top cycle
- [x] API routes:
  - `GET /api/kpis`
  - `GET /api/opportunities`
  - `GET /api/executions`
  - `GET /api/treasury`
  - `GET /api/venues` (returns nodes + edges)
  - `POST /api/scan` (triggers one scan tick)
- [x] `ScanButton` client component that POSTs `/api/scan` + refreshes UI

## ✅ Phase 3 — Real venue data

> No mock data. Price graph populates from live, public, no-auth REST endpoints. Treasury + executions remain synthesized until Circle wallets are funded in Phase 5.

- [x] 🔥 `src/venues/hyperliquid.ts` — `POST https://api.hyperliquid.xyz/info { type: "allMids" }`; returns `Record<symbol, number>`
- [x] 🔥 `src/venues/binance.ts` — `GET https://api.binance.com/api/v3/ticker/price`; filter to ETHUSDT, BTCUSDT, SOLUSDT, EURUSDT
- [x] 🔥 `src/venues/chainlink.ts` — `eth_call latestRoundData()` on Chainlink Aggregator V3 (ETH/USD, BTC/USD, EUR/USD) via public Ethereum RPC
- [x] 🔥 `src/venues/refresh.ts` — orchestrator: HL + Binance + Chainlink in parallel → `PriceEdge[]` (USDC↔ETH, USDC↔BTC, USDC↔SOL, USDC↔EURC)
- [x] 🔥 `runScan()` in `store.ts` calls `refreshLiveEdges()` first; seed is a warm-start fallback only if all fetches fail
- [x] 🔥 `POST /api/scan` runs the live refresh → search → opportunistic execute pipeline on every tick
- [x] Dashboard "last refresh" badge is real (`kpis.lastScanAtMs`)
- [x] `/dashboard/venues` page surfaces real mids, fees, liquidity, age per venue
- [x] `/dashboard/graph` page lists every directed edge + every cycle found this tick
- [ ] Add `src/venues/uniswap.ts` — Uniswap V3 QuoterV2 quotes via viem (next slice)
- [ ] Add `src/venues/curve.ts` — Curve stable-pool quotes via viem (next slice)

## ⬜ Phase 4 — Agent reasoning + executor

- [ ] `src/agent/score.ts` — rank candidate cycles by expected PnL × fill probability
- [ ] `src/agent/size.ts` — Kelly-bounded sizing capped by per-edge liquidity (mostly done in `graph/search.ts`)
- [ ] `src/executor/route.ts` — decide Gateway vs CCTP per chain hop
- [ ] `src/executor/run.ts` — execute legs in deterministic order; record receipts
- [ ] `src/agent/decide.ts` — Claude Sonnet call for cost-honest sanity check on ambiguous cycles

## 🔧 Phase 5 — Circle integration (real wallets)

- [x] `src/lib/circle.ts` — singleton `initiateDeveloperControlledWalletsClient` + `ensureWalletSet` + `provisionArgoWallets` + `listArgoWallets` (lazy SDK import, env-gated)
- [x] `src/lib/arc.ts` — Arc Testnet chain id 5042002, all RPC endpoints, contract addresses (USDC, EURC, USYC, CCTP, Gateway, StableFX, Paymaster, Memo, Multicall3From, CREATE2, Multicall3, Permit2), explorer + faucet links
- [x] `GET/POST /api/wallets` route — list and provision wallets on `ARC-TESTNET`, surfaces config status, returns addresses for faucet funding
- [x] `/dashboard/wallets` page — provision button, address list with explorer links + faucet shortcut
- [x] `/dashboard/network` page — surfaces every Arc constant for ops + sign-off
- [ ] Wire `npm i @circle-fin/developer-controlled-wallets`, set `CIRCLE_API_KEY` + `CIRCLE_ENTITY_SECRET`, provision wallets, fund via faucet.circle.com
- [ ] `src/circle/gateway/balance.ts` — real unified balance read (replaces synthesized treasury)
- [ ] `src/circle/cctp/migrate.ts` — cross-chain USDC moves on route hops
- [ ] `src/circle/paymaster/wrap.ts` — gas-in-USDC for every tx
- [ ] `src/circle/usyc/park.ts` — sweep idle USDC into USYC between captured arbs

## ⬜ Phase 6 — Onchain (Foundry)

- [ ] `contracts/RouteRegistry.sol` — `RouteExecuted(id, cycleHash, profitUsdc, legs[])` events
- [ ] Foundry setup + deploy to Arc testnet via ARC CLI
- [ ] `src/lib/addresses.ts` — deployed addresses
- [ ] Link tx receipts in executions table

## ⬜ Phase 7 — Hardening & traction

- [ ] Run live scan loop continuously for 24h
- [ ] Capture screenshots of real opportunities
- [ ] Onboard 1+ external user
- [ ] Tweet thread with live dashboard
- [ ] Capture submission metrics

## ⬜ Phase 8 — Submission (May 25)

- [ ] Deploy to Vercel
- [ ] Record 3-min Loom: problem → live graph (real prices) → executed route → onchain receipt → Circle stack walkthrough
- [ ] Final push to GitHub
- [ ] Submit https://forms.gle/hFPM2t4Jt1zGfqzM7

---

## Data sources (real, no auth)

| Source | Endpoint | Tokens | Status |
|---|---|---|---|
| Hyperliquid | `POST api.hyperliquid.xyz/info` `{type:"allMids"}` | ETH, BTC, SOL | ✅ live |
| Binance | `GET api.binance.com/api/v3/ticker/price` | ETHUSDT, BTCUSDT, SOLUSDT, EURUSDT | ✅ live |
| Chainlink | `eth_call latestRoundData()` via Cloudflare/LlamaRPC | ETH/USD, BTC/USD, EUR/USD | ✅ live |
| Uniswap V3 | viem call to QuoterV2 on Eth/Base/Arb | ETH, USDC, USDT, EURC | ⬜ next slice |
| Curve | viem call to stable pool `get_dy` | USDC, USDT, EURC | ⬜ next slice |

## Arc Testnet (where Argo settles)

| Param | Value |
|---|---|
| Chain ID | `5042002` |
| Currency | USDC (also pays gas) |
| Primary RPC | https://rpc.testnet.arc.network (+ Blockdaemon, dRPC, QuickNode) |
| Explorer | https://testnet.arcscan.app |
| Faucet | https://faucet.circle.com |
| Native USDC | `0x3600000000000000000000000000000000000000` |

Full constants live in [`src/lib/arc.ts`](./src/lib/arc.ts). Browse them at [`/dashboard/network`](./src/app/(dashboard)/dashboard/network/page.tsx).

## Open decisions

- [ ] Scan interval (manual via button now; background poller next)
- [ ] Initial venue set in Phase 3.1: HL + Binance (real, easy) → add Uniswap + Curve in Phase 3.2
- [ ] Min cycle profit threshold: 5 bps (current) — may need 10 bps after real-fee accounting
- [ ] Treasury/executions display: clearly label as "synthesized" until Phase 5 Circle wallets fund real balances
