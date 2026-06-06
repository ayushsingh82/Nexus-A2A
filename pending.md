# Build Checklist — Argo

Deadline: **May 25, 2026** · Today: **May 17** · **8 days remaining**

Legend: `[x]` shipped · `[~]` partial · `[ ]` not started · 🔥 = blocker

---

## ✅ Phase 0 — Setup & docs

- [x] Next.js 16 + Tailwind 4 + App Router scaffold at `/argo`
- [x] `hackathon.md` — Agora hackathon reference (RFB 05 focus)
- [x] `README.md` — vision, architecture, Circle stack mapping
- [x] `pending.md` — this file
- [ ] `git remote add origin https://github.com/ayushsingh82/Argo.git`
- [ ] Push 2 commits to GitHub
- [ ] Read `node_modules/next/dist/docs/` (Next.js 16 breaking-change warning in AGENTS.md)

## 🟡 Phase 1 — Design system + app shell (IN PROGRESS)

Mirror the SpendOS look: light theme, `#01B73E` green brand, app-shell with left sidebar + main content area.

- [ ] `globals.css` — design tokens (--bg-base #ffffff, --teal #01b73e, --border, --radius)
- [ ] `layout.tsx` — Geist Sans + Geist Mono + Allura cursive (for brand text)
- [ ] `components/Sidebar.tsx` — left nav (Dashboard / Markets / Routes / Executions / Treasury / Settings)
- [ ] `components/AppShellHeader.tsx` — top header with brand mark + live status pill
- [ ] `components/ArgoLogo.tsx`
- [ ] `app/(dashboard)/layout.tsx` — app-shell wrap
- [ ] Marketing landing at `/` (hero, problem, solution, CTA)
- [ ] Dashboard at `/dashboard` (KPIs, opportunity feed, route history)
- [ ] Confirm dev server renders both layouts cleanly

## ⬜ Phase 2 — Backend foundation

- [ ] `src/graph/types.ts` — `Node`, `Edge`, `Cycle`, `PriceSnapshot`
- [ ] `src/graph/build.ts` — construct directed graph from venue snapshots
- [ ] `src/graph/search.ts` — Bellman-Ford + SPFA negative-cycle detection over `-log(rate × (1 − fees))`
- [ ] In-memory store: `routes`, `executions`, `treasury`, `kpis`
- [ ] API routes: `GET /api/graph` `GET /api/opportunities` `GET /api/executions` `GET /api/treasury` `POST /api/scan`

## ⬜ Phase 3 — Venue clients

- [ ] `src/venues/hyperliquid.ts` — public mids + funding (reuse pattern from Darwinian)
- [ ] `src/venues/uniswap.ts` — Uniswap V3 quotes via QuoterV2 calls
- [ ] `src/venues/curve.ts` — Curve stable pool quotes (USDC/EURC/USDT)
- [ ] `src/venues/binance.ts` — public WebSocket for CEX reference price
- [ ] Snapshot poller: every N ms, refresh all venue prices and push into graph

## ⬜ Phase 4 — Agent reasoning + execution

- [ ] `src/agent/score.ts` — rank candidate cycles by expected PnL × fill probability
- [ ] `src/agent/size.ts` — Kelly-bounded sizing capped by per-edge liquidity
- [ ] `src/executor/route.ts` — decide Gateway vs CCTP per chain hop
- [ ] `src/executor/run.ts` — execute legs in deterministic order, record receipts
- [ ] `src/agent/decide.ts` — Claude Sonnet call when cycle is ambiguous (cost-honest sanity check)

## ⬜ Phase 5 — Circle integration

- [ ] `src/circle/client.ts` — singleton `initiateDeveloperControlledWalletsClient`
- [ ] `src/circle/wallets/factory.ts` — one wallet per venue
- [ ] `src/circle/gateway/balance.ts` — read unified USDC balance across chains
- [ ] `src/circle/cctp/migrate.ts` — cross-chain USDC moves for route hops
- [ ] `src/circle/paymaster/wrap.ts` — gas-in-USDC for every tx
- [ ] `src/circle/usyc/park.ts` — sweep idle USDC into USYC between opportunities

## ⬜ Phase 6 — Onchain

- [ ] `contracts/RouteRegistry.sol` — emit `RouteExecuted(id, cycleHash, profitUsdc, legs[])`
- [ ] Foundry setup + deploy to Arc testnet via ARC CLI
- [ ] `src/lib/addresses.ts` — deployed addresses
- [ ] Link tx receipts in dashboard

## ⬜ Phase 7 — Hardening & traction

- [ ] Run scanner continuously 24h on testnet; capture executed routes
- [ ] Onboard 1+ external user (Discord / Twitter / friend)
- [ ] Tweet thread with live dashboard
- [ ] Capture metrics for submission form (opportunities captured, profit, avg latency, success rate)

## ⬜ Phase 8 — Submission (May 25)

- [ ] Deploy to Vercel; live URL working
- [ ] Record 3-min Loom: problem → live graph → executed route → onchain receipt → Circle stack walkthrough
- [ ] Final push to GitHub
- [ ] Submit https://forms.gle/hFPM2t4Jt1zGfqzM7
- [ ] Post in Canteen Discord

---

## Open decisions

- [ ] Initial venue set: HL + Uniswap-Eth + Uniswap-Base + Curve-Eth (4 venues = 12-edge graph)
- [ ] Scan interval: 500ms (matches Gateway latency floor)
- [ ] Min cycle profit threshold: 5 bps net of fees + slippage
- [ ] Max position per leg: 10% of treasury

## Stretch goals

- [ ] Funding-rate arbitrage edges (HL funding vs spot)
- [ ] EURC↔USDC FX leg (only product where EURC is load-bearing)
- [ ] Public "fund Argo's treasury" form so judges can stake USDC
