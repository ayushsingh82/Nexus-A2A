# Nexus-A2A — DeFi Yield Swarm

> Four agents. One delegation. Maximum yield.

Nexus-A2A is an autonomous DeFi yield optimizer built on MetaMask Smart Accounts. A master orchestrator agent receives a single ERC-7715 permission from the user's wallet, then subdelegates via ERC-7710 to three specialized sub-agents that autonomously deploy USDC across Aave v3, Uniswap V3, and Hyperliquid — rebalancing toward the highest APY on every tick.

**Tracks targeted:** Best A2A Coordination · Best Agent ($6,000 potential)

---

## The problem it solves

Traditional DeFi yield requires the user to:
1. Manually approve each protocol
2. Periodically rebalance across protocols
3. Pay ETH gas for every action

Nexus-A2A removes all three. You sign once. The swarm handles the rest.

---

## Architecture

```
[User — MetaMask Flask]
         │
         │  ERC-7715 grant
         │  "spend up to 500k USDC/week for yield"
         ▼
[Master Orchestrator] ─────────────────────────────
         │                                         │
         │ ERC-7710 subdelegation                  │ ERC-7710 subdelegation
         │ cap: 200k USDC                          │ cap: 150k USDC
         ▼                                         ▼
   [Aave Agent]                            [Uniswap LP Agent]
   Aave v3 · Base                          Uniswap V3 · Ethereum
   USDC supply · ~5.2% APY                 USDC/ETH LP · ~8.4% APY
                           │
                           │ ERC-7710 subdelegation
                           │ cap: 150k USDC
                           ▼
                    [Perp Funding Agent]
                    Hyperliquid · BTC perp
                    Funding rate · ~11.2% APY
```

Every agent action is relayed by **1Shot** — gas paid in USDC, no ETH required.

---

## How redelegation works (A2A track requirement)

ERC-7710 lets the master agent issue signed on-chain subdelegations to sub-agents. Each delegation:
- Has a **cap** (max USDC the sub-agent can deploy)
- Has **caveats** (which protocol, which token, which action)
- Is **revocable** by the user at any time
- Can be **rebalanced** — master redelegates from underperformer to leader

This is trustless A2A coordination. The sub-agents never need the user's key.

---

## Rebalancing logic

Every swarm tick:
1. Fetch live APY from DeFiLlama (Aave, Uniswap) + Hyperliquid (funding rates)
2. Compare weighted APY across agents
3. If the spread between best and worst exceeds 100 bps:
   - Master redelegates 5–15k USDC from underperformer to leader
   - New delegation caps are set on-chain via ERC-7710
4. All agents collect yield (1 day's worth per tick)
5. 1Shot relayer settles all transactions in USDC

---

## Live data sources (public, no auth)

| Source      | Endpoint | What it provides |
|---|---|---|
| DeFiLlama   | `yields.llama.fi/pools` | Aave v3 USDC APY · Uniswap V3 USDC/ETH APY |
| Hyperliquid | `api.hyperliquid.xyz/info` | BTC perpetual funding rate (annualized) |

---

## Tech stack

- **Next.js 16** · TypeScript · Tailwind 4 · App Router
- **@metamask/smart-accounts-kit** — EIP-7710 + ERC-7715
- **viem** — smart account client + bundler
- **1Shot API** — permissionless relayer, gas in USDC
- **Venice AI** — market intelligence for rebalance decisions
- **x402 protocol** — agent-to-agent micropayments for AI queries
- DeFiLlama yields API · Hyperliquid info API

---

## Dashboard

| Page | What it shows |
|---|---|
| `/dashboard` | Live KPIs, agent tasks, portfolio, execution log, agent registry |
| `/dashboard/agents` | Full agent registry with delegation details |
| `/dashboard/delegations` | Live delegation tree (master → sub-agents) |
| `/dashboard/executions` | All onchain actions via 1Shot |
| `/dashboard/portfolio` | Capital deployed per agent, weekly yield projection |
| `/dashboard/ask` | Ask the swarm anything in plain English |

---

## API surface

| Endpoint | Returns |
|---|---|
| `GET /api/kpis` | Swarm KPIs (deployed, avg APY, yield earned, delegations active) |
| `GET /api/opportunities` | Active yield tasks per agent |
| `GET /api/executions` | Agent execution log (collect-yield, redelegate, deposit) |
| `GET /api/treasury` | Portfolio state (total, deployed, idle, per-agent) |
| `GET /api/venues` | Agent registry + delegation list |
| `POST /api/scan` | Trigger one swarm tick (fetch APY → decide → collect yield) |

---

## Run locally

```bash
git clone https://github.com/ayushsingh82/Argo.git
cd Argo
npm install
npm run dev
```

Open `http://localhost:3000` for the landing page, `/dashboard` for the live swarm, `/pitch` for the deck.

---

## Demo flow (90 seconds)

1. Show MetaMask Flask → ERC-7715 permission grant (user approves once)
2. Dashboard loads — Agent Registry shows Master + 3 sub-agents with live APY
3. Hit **"Run swarm cycle"** → delegation tree animates as master redelegates
4. Execution log shows: collect-yield × 3 + redelegate (if triggered)
5. Portfolio panel updates — deployed USDC and yield earned increase
6. Autopilot ON — watch the swarm run continuously on real DeFiLlama + Hyperliquid data

---

## Hackathon tracks

| Track | Requirement | How Nexus-A2A qualifies |
|---|---|---|
| **Best A2A Coordination** | Must use redelegation | Master → 3 sub-agents via ERC-7710. Caps adjust every tick based on live APY. |
| **Best Agent** | MetaMask Smart Accounts in main flow | ERC-7715 permission grant is step 1. Every agent action uses the smart account. |
| **Best Use of 1Shot** | Relay ERC-7710 txs through 1Shot mainnet | All agent transactions relayed via 1Shot — gas in USDC. |
