# Nexus-A2A

> Agent swarm. One delegation. Maximum yield.

**Nexus-A2A** is an autonomous DeFi yield optimizer where an orchestrator agent receives a single ERC-7715 permission from your MetaMask wallet, then subdelegates to a swarm of specialized sub-agents that autonomously deploy USDC across Aave, Uniswap, and Hyperliquid — rebalancing toward the best APY every tick. Type a prompt. The swarm executes.

**Everything runs on Base Sepolia (chain ID 84532) — testnet only.**

---

## Architecture

```
 ┌──────────────────────────────────────────────────────────────────┐
 │  User Wallet  (MetaMask Flask + Smart Account EIP-7702)          │
 └────────────────────────────┬─────────────────────────────────────┘
                              │
                              │  ERC-7715 wallet_grantPermissions
                              │  "spend up to 500 USDC for yield"
                              ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │                     Orchestrator Agent                           │
 │              (receives ERC-7715 · issues ERC-7710)               │
 └─────────┬──────────────────┬──────────────────┬─────────────────┘
           │                  │                  │
           │ ERC-7710         │ ERC-7710         │ ERC-7710
           │ cap 200 USDC     │ cap 150 USDC     │ cap 150 USDC
           ▼                  ▼                  ▼
 ┌─────────────────┐ ┌────────────────┐ ┌─────────────────────┐
 │   Aave Agent    │ │  Uniswap LP    │ │   Perp Agent        │
 │  USDC supply    │ │  USDC/ETH LP   │ │  BTC funding rate   │
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
                     │  Base Sepolia  │  chain ID 84532
                     │  on-chain txs  │
                     └────────────────┘
```

---

## Network

| Parameter | Value |
|---|---|
| Network | Base Sepolia |
| Chain ID | `84532` |
| RPC | `https://sepolia.base.org` |
| Explorer | `https://sepolia.basescan.org` |
| Faucet | `https://www.coinbase.com/faucets/base-ethereum-goerli-faucet` |
| Native token | ETH (test) |

---

## Contract Addresses — Base Sepolia (chain 84532)

### Tokens

| Token | Address | Notes |
|---|---|---|
| **USDC** | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | Circle test USDC — get from faucet |
| **WETH** | `0x4200000000000000000000000000000000000006` | Wrapped ETH (same on all Base networks) |

### ERC-4337 / Account Abstraction

| Contract | Address | Notes |
|---|---|---|
| **EntryPoint v0.7** | `0x0000000071727De22E5E9d8BAf0edAc6f37da032` | EIP-4337 singleton |
| **Permit2** | `0x000000000022D473030F116dDEE9F6B43aC78BA3` | Universal permit |
| **Multicall3** | `0xcA11bde05977b3631167028862bE2a173976CA11` | Batch reads |

### MetaMask Delegation Framework (ERC-7710 / ERC-7715)

| Contract | Address | Notes |
|---|---|---|
| **DelegationManager** | Resolved via `getSmartAccountsEnvironment(84532).DelegationManager` | MetaMask smart-accounts-kit |
| **Caveat Enforcers** | Resolved from same env | ERC-20 transfer caps, time limits |

> Use `@metamask/smart-accounts-kit` — call `getSmartAccountsEnvironment(84532)` to get all delegation framework addresses at runtime. Do not hardcode them.

ERC-7715 permission request (MetaMask Flask only):
```ts
await window.ethereum.request({
  method: 'wallet_grantPermissions',
  params: [{ ... }]
})
```

### Aave v3 — Base Sepolia

| Contract | Address | Notes |
|---|---|---|
| **Pool** | `0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b` | Supply / borrow |
| **PoolAddressesProvider** | `0xd449FeD49d9C443688d6816fE6872F21402e41de` | Address registry |
| **aUSDC (interest-bearing)** | `0x96A5399D07896f757Bd4c6eF56461F58DB951862` | Received on supply |

### Uniswap v3 — Base Sepolia

| Contract | Address | Notes |
|---|---|---|
| **Factory** | `0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24` | Pool creation |
| **SwapRouter02** | `0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4` | Token swaps |
| **NonfungiblePositionManager** | `0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2` | LP positions |
| **Quoter v2** | `0xC5290058841028F1614F3A6F0F5816cAd0df5E27` | Price quotes |

### Relayer

| Service | URL | Notes |
|---|---|---|
| **1Shot Relayer** | `https://relayer.1shotapi.com/relayers` | Gas in USDC, private relay |

---

## Delegation Flow (step by step)

```
1. User connects MetaMask Flask
2. User calls wallet_grantPermissions (ERC-7715)
   → MetaMask shows permission UI: "allow up to 500 USDC for yield agents"
   → Returns permissionsContext (delegation hash + proof)
3. Orchestrator receives the delegation
4. Orchestrator creates ERC-7710 subdelegations to sub-agents:
   → Aave Agent:   cap 200 USDC, caveat = ERC-20 spend limit
   → Uniswap Agent: cap 150 USDC, caveat = ERC-20 spend limit
   → Perp Agent:   cap 150 USDC, caveat = ERC-20 spend limit
5. Sub-agents execute within their caps (browser-signed):
   → Approve USDC to Aave Pool
   → AavePool.supply(USDC, amount, onBehalfOf, 0)
   → Receive aUSDC (yield-bearing)
6. Every 9 s: fetch live APY → rebalance if spread > 100 bps
7. All txs visible on https://sepolia.basescan.org
```

---

## Rebalancing Loop

```
  ┌─ Fetch APY ──────────────────────────────────────────────────┐
  │  DeFiLlama: Aave USDC APY, Uniswap USDC/ETH APY             │
  │  Hyperliquid: BTC perp funding rate (annualized)             │
  └──────────────────────────────────────────────────────────────┘
       ↓ compare weighted APY across agents
  ┌─ Decide ─────────────────────────────────────────────────────┐
  │  spread > 100 bps → redelegate USDC from bottom → top agent  │
  │  all agents → collect-yield each tick                        │
  └──────────────────────────────────────────────────────────────┘
       ↓ browser-signed txs (MetaMask Flask popup)
  ┌─ Record ─────────────────────────────────────────────────────┐
  │  every action → execution log (agentName · protocol · txHash)│
  │  portfolio + KPIs update live                                │
  └──────────────────────────────────────────────────────────────┘
```

---

## Prompt → Action

```
  You: "Deploy 100 USDC to best yield"
       ↓
  Swarm: parses intent → finds top APY agent → shows action preview
       ↓
  Confirm in MetaMask → tx signed in browser → tx hash in execution log
```

Examples:
- `Deploy 100 USDC to Aave`
- `Show my portfolio status`
- `Rebalance from Aave to Uniswap`
- `Withdraw 50 USDC from Aave`

---

## What makes it different

| Feature | Nexus-A2A |
|---|---|
| No private key handoff | ERC-7715 scoped permission only |
| Trustless subdelegation | ERC-7710 with per-agent USDC caps + caveats |
| Browser-signed | Every agent tx signed by MetaMask Flask — user stays in control |
| Live APY data | DeFiLlama + Hyperliquid — real rates, not mocked |
| Prompt → Action | Type intent, swarm executes |
| Animated delegation tree | Real ERC-7710 graph with capital flow |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 · TypeScript |
| Wallet | wagmi v2 · viem · MetaMask Flask |
| Smart accounts | EIP-7702 · ERC-7710 · ERC-7715 |
| Delegation SDK | `@metamask/smart-accounts-kit` |
| Data | DeFiLlama yields API · Hyperliquid info API |
| Chain | Base Sepolia (chain ID 84532) |

---

## Dashboard Pages

| Page | What it shows |
|---|---|
| `/dashboard` | Live KPIs · delegation flow · agent tasks · executions |
| `/dashboard/command` | Prompt → Action chat interface |
| `/dashboard/agents` | Agent registry with delegation details |
| `/dashboard/delegations` | ERC-7710 delegation tree |
| `/dashboard/executions` | All on-chain actions |
| `/dashboard/portfolio` | Capital deployed per agent · weekly yield |
| `/dashboard/risk` | Risk gates per agent |
| `/dashboard/strategy` | Strategy lab |

---

## API Routes

| Endpoint | Method | Returns |
|---|---|---|
| `/api/kpis` | GET | Swarm KPIs |
| `/api/opportunities` | GET | Active yield tasks per agent |
| `/api/executions` | GET | Execution log |
| `/api/treasury` | GET | Portfolio state |
| `/api/venues` | GET | Agent registry + delegations |
| `/api/scan` | POST | Trigger one swarm tick |
| `/api/command` | POST | Parse prompt → structured action |

---

## Run Locally

```bash
git clone https://github.com/ayushsingh82/Nexus-A2A.git
cd nexus-a2a
npm install
npm run dev
```

Open `http://localhost:3000` — connect MetaMask Flask to **Base Sepolia**.

---

## Hackathon Tracks

| Track | How Nexus-A2A qualifies |
|---|---|
| Best A2A Coordination | Orchestrator → swarm via ERC-7710. Caps rebalance every tick on live APY. |
| Best Agent | ERC-7715 permission is step 1. Every agent action uses the delegation proof. |
| Best Use of MetaMask | Flask-native flow — `wallet_grantPermissions` → subdelegation → browser-signed execution. |

---

## Live

**[https://nexus-a2a.vercel.app](https://nexus-a2a.vercel.app)** · Base Sepolia · testnet
