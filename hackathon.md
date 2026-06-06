# Agora Agents Hackathon — Reference

> Where AI agents make markets. A builder series for agents that trade, invest, create, and interface with markets — settled instantly on Arc with USDC.

## Hosts

- **Canteen** — Host. Research and technology firm at the intersection of crypto, AI, and payments.
- **Circle (NYSE: CRCL)** — Platform. Issuer of USDC and EURC.
- **Arc** — Settlement. Purpose-built L1 from Circle. Sub-second deterministic finality; ~$0.01 transaction fees paid in USDC.

## Format

| | |
|---|---|
| Mode | Online · 2 weeks |
| Dates | May 11 → May 25, 2026 |
| Settlement | Arc · USDC |
| Access | Apply to join |
| Judging | Asynchronous — no live demo day |
| Submission deadline | May 25, 2026 |
| Apply form | https://forms.gle/hFPM2t4Jt1zGfqzM7 |

## Awards — $50k total

| Tier | Amount | Teams |
|---|---|---|
| 1st place | $10,000 | 1 |
| 2nd place | $7,500 × 2 | 2 ($15k total) |
| 3rd place | $5,000 × 3 | 3 ($15k total) |
| Standout teams | $7,500 split | 10–12 (~$650–$750 each) |
| Feedback incentives | $500 total | Devs giving best Circle DX feedback |
| Easter eggs | $2,000 total | Side quests & puzzles |

## Judging weights

| Weight | Criterion |
|---|---|
| **30%** | Agentic Sophistication — real AI decisions vs automation |
| **30%** | Traction — real users, real transactions, real volume |
| **20%** | Circle tool usage — Wallets, CCTP, Gateway, App Kit, Contracts, USYC, USDC, Paymaster |
| **20%** | Innovation — novel approaches, emergent behavior, research insight |

Judges: panel with backgrounds from Stellar, Coinbase, Arc / Circle, Protocol Labs.

## Submission requirements

| Requirement | Status |
|---|---|
| Public GitHub repo | Required |
| Video demo (Loom / YouTube / Vimeo, max 3 min) | Required |
| Live deployed link | Encouraged |
| Traction report (users onboarded, problems solved) | Required in form |

## RFB 05 — Cross-Platform Arbitrage Agent

> Discrepancies vanish in seconds. Detect, route, execute — survive slippage.

The problem: price discrepancies across exchanges and chains exist but disappear in seconds. Capturing arbitrage requires instant detection, cross-chain execution, and precise cost accounting.

**What the AI decides:**
- When real arbitrage opportunities exist (price differences across platforms)
- Optimal trade sizing accounting for slippage and fees
- Which bridge / route to use (CCTP vs alternatives)
- Whether opportunity is profitable after all costs
- Risk management — what if price moves during execution?

**What builders create:**
- Real-time price monitoring across CEXs and DEXs
- Cross-chain execution engines optimized for speed
- Profitability calculators accounting for all fees and slippage
- Risk-adjusted opportunity scoring systems

**Example builds:**
- ArbAgent — finds CEX/DEX discrepancies, executes via CCTP
- TriangularArb — multi-hop arbitrage (USDC → ETH → BTC → USDC) across chains
- FundingArb — arbitrage between spot and perps funding rates

**Traction metrics:**
- Number of arbitrage opportunities captured
- Total profit generated
- Average execution time
- Success rate (profitable / attempts)

## Circle developer stack

| Product | Argo use |
|---|---|
| **USDC** | Settlement leg of every arb route |
| **EURC** | FX-aware nodes in the price graph (e.g. USDC↔EURC↔ETH) |
| **USYC** | Park idle capital between arbs — the swarm of routes self-funds |
| **Wallets** | One Circle Wallet per venue, holding working capital |
| **Gateway** | Unified USDC balance + sub-500ms cross-chain — *load-bearing for arb to be possible* |
| **CCTP** | Cross-chain USDC settlement for routes that span chains |
| **Paymaster** | All gas paid in USDC so per-route PnL accounting stays clean |
| **Contracts** | Route execution registry on Arc; every captured arb is an onchain receipt |
| **App Kit** | Unified Balance dashboard for treasury |

## Why Arc is load-bearing for this idea

- **Sub-second finality** — without it, opportunities vanish during settlement
- **~$0.01 fees in USDC** — without it, per-route economics never close
- **Deterministic ordering** — execution is sandwich-resistant by construction

Anywhere else, this product can't run profitably at retail size.

## Onboarding

1. Canteen Discord: https://discord.gg/TGnyfKh23V
2. Arc builder Discord: https://discord.com/invite/buildonarc (mention Canteen + Agora)
3. ARC CLI: `uv tool install git+https://github.com/the-canteen-dev/ARC-cli`
4. Submit project: https://forms.gle/hFPM2t4Jt1zGfqzM7
