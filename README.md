# Nexus-A2A

> Agent swarm. One delegation. Maximum yield.

**Nexus-A2A** is an autonomous DeFi yield optimizer where an orchestrator agent receives a single ERC-7715 permission from your MetaMask wallet, then subdelegates to a swarm of specialized sub-agents that autonomously deploy USDC across Aave, Uniswap, and Hyperliquid — rebalancing toward the best APY every tick. Type a prompt. The swarm executes.

---

## Architecture

```
 ┌──────────────────────────────────────────────────────────────────┐
 │  User Wallet  (MetaMask Flask + Smart Account EIP-7702)          │
 └────────────────────────────┬─────────────────────────────────────┘
                              │
                              │  ERC-7715 permission grant
                              │  "spend up to 500k USDC/week"
                              ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │                     Orchestrator Agent                           │
 │              (receives ERC-7715 · issues ERC-7710)               │
 └─────────┬──────────────────┬──────────────────┬─────────────────┘
           │                  │                  │
           │ ERC-7710         │ ERC-7710         │ ERC-7710
           │ cap 200k USDC    │ cap 150k USDC    │ cap 150k USDC
           ▼                  ▼                  ▼
 ┌─────────────────┐ ┌────────────────┐ ┌─────────────────────┐
 │   Aave Agent    │ │ Uniswap LP     │ │   Perp Agent        │
 │  USDC supply   │ │ USDC/ETH LP    │ │  BTC funding rate   │
 │  ~5.2% APY     │ │ ~8.4% APY      │ │  ~11.2% APY         │
 └────────┬────────┘ └───────┬────────┘ └──────────┬──────────┘
          │                  │                      │
          └──────────────────┴──────────────────────┘
                             │
                     ┌───────▼────────┐
                     │  1Shot Relayer │  ← gas paid in USDC
                     │  ERC-7710 exec │    no ETH required
                     └───────┬────────┘
                             │
                     ┌───────▼────────┐
                     │  Base Sepolia  │
                     │  on-chain txs  │
                     └────────────────┘
```

**Rebalancing loop (every 9 s in autopilot):**

```
  ┌─ Fetch APY ──────────────────────────────────────────────────┐
  │  DeFiLlama: Aave USDC APY, Uniswap USDC/ETH APY             │
  │  Hyperliquid: BTC perp funding rate (annualized)             │
  └──────────────────────────────────────────────────────────────┘
       ↓ compare weighted APY across agents
  ┌─ Decide ─────────────────────────────────────────────────────┐
  │  spread > 100 bps → redelegate 5–15k USDC from bottom → top  │
  │  all agents → collect-yield (1 day's worth per tick)         │
  └──────────────────────────────────────────────────────────────┘
       ↓ execute via 1Shot (USDC gas)
  ┌─ Record ─────────────────────────────────────────────────────┐
  │  every action → execution log (agentName · protocol · txHash)│
  │  portfolio + KPIs update live                                │
  └──────────────────────────────────────────────────────────────┘
```

---

## Prompt → Action (key feature)

Type in plain English. The swarm parses your intent and prepares a confirmed on-chain action:

```
  You: "Deploy 500 USDC to best yield"
       ↓
  Swarm: parses intent → finds top APY agent → shows action preview
       ↓
  Confirm in MetaMask → 1Shot relay → on-chain tx on Base Sepolia
```

Examples:
- `Deploy 100 USDC to Aave`
- `Show my portfolio status`
- `Rebalance from Aave to Uniswap`
- `Send 10 USDC to 0x1234…`
- `Withdraw 50 USDC from Aave`

---

## Wallet Connect (Base Sepolia)

Connect your MetaMask wallet directly from the sidebar:
- Displays your USDC balance on Base Sepolia
- ERC-7715 permission flow links to your connected account
- USDC contract: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

---

## What makes it different

| Feature | Nexus-A2A |
|---|---|
| No private key handoff | ERC-7715 scoped permission only |
| Gas in USDC | 1Shot relayer — no ETH needed |
| Prompt → Action | Type intent, swarm executes |
| Live delegation flow | Animated A2A capital flow visualization |
| Rebalances automatically | Every 9 s — follows live APY |
| Wallet-native | MetaMask sidebar connect + USDC balance |

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 · TypeScript · Tailwind 4 |
| Wallet | wagmi v2 · viem · MetaMask injected |
| Smart accounts | EIP-7702 · ERC-7710 · ERC-7715 |
| Relayer | 1Shot API — USDC gas, private relay |
| AI | Venice AI — market intelligence |
| Payments | x402 — agent-to-agent micropayments |
| Data | DeFiLlama yields API · Hyperliquid info |
| Chain | Base Sepolia (chain ID 84532) |

---

## Dashboard

| Page | What it shows |
|---|---|
| `/dashboard` | Live KPIs · delegation flow animation · agent tasks · executions |
| `/dashboard/command` | **Prompt → Action** chat interface |
| `/dashboard/agents` | Agent registry with delegation details |
| `/dashboard/delegations` | ERC-7710 delegation tree |
| `/dashboard/executions` | All on-chain actions via 1Shot |
| `/dashboard/portfolio` | Capital deployed per agent · weekly yield |
| `/dashboard/ask` | Ask the swarm in plain English |

---

## API

| Endpoint | Returns |
|---|---|
| `GET /api/kpis` | Swarm KPIs |
| `GET /api/opportunities` | Active yield tasks per agent |
| `GET /api/executions` | Execution log |
| `GET /api/treasury` | Portfolio state |
| `GET /api/venues` | Agent registry + delegations |
| `POST /api/scan` | Trigger one swarm tick |
| `POST /api/command` | Parse prompt → structured action |

---

## Live demo

**[https://nexus-a2a.vercel.app](https://nexus-a2a.vercel.app)**

| Path | Description |
|---|---|
| `/` | Landing page |
| `/dashboard` | Live swarm dashboard |
| `/dashboard/command` | Prompt → Action interface |

## Run locally

```bash
git clone https://github.com/ayushsingh82/nexus-a2a.git
cd nexus-a2a
npm install
npm run dev
```

---

## Demo (90 seconds)

```
1. Connect MetaMask (sidebar) → Base Sepolia · USDC balance shows
2. Dashboard loads → delegation flow animation with capital flowing
3. "Run swarm cycle" → agents collect yield, rebalance fires if APY spreads
4. Open /dashboard/command → type "Deploy 100 USDC to best yield"
5. Action preview: agent name · APY · estimated gas in USDC
6. Confirm in MetaMask → 1Shot relay → tx hash in execution log
7. Autopilot ON → watch continuous rebalancing on live DeFiLlama + Hyperliquid
```

---

## Hackathon tracks

| Track | How Nexus-A2A qualifies |
|---|---|
| Best A2A Coordination | Orchestrator → swarm via ERC-7710. Caps rebalance every tick on live APY. |
| Best Agent | ERC-7715 permission is step 1. Every agent action uses the smart account. |
| Best Use of 1Shot | All agent txs relayed via 1Shot — USDC gas, private relay. |
