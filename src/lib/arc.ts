/**
 * Arc Testnet — network constants + contract addresses.
 *
 * Single source of truth for chain id, RPC endpoints, faucet, block explorer,
 * and every contract address Argo touches on Arc.
 *
 * Source: Circle's Arc docs (https://docs.arc.io). USDC is the native gas
 * token on Arc and uses 18 decimals when paying gas, but the ERC-20 interface
 * at 0x36...00 uses the standard 6 decimals — always read `decimals()` on the
 * token contract before formatting balances.
 *
 * Mainnet addresses are not yet available. When they ship, mirror this file
 * into `arcMainnet.ts` rather than mutating these constants.
 */

export const ARC_TESTNET_CHAIN_ID = 5042002;
export const ARC_TESTNET_CURRENCY_SYMBOL = "USDC";

export const ARC_TESTNET_RPC = {
  /** Circle's first-party RPC. */
  primary: {
    http: "https://rpc.testnet.arc.network",
    ws: "wss://rpc.testnet.arc.network",
  },
  blockdaemon: {
    http: "https://rpc.blockdaemon.testnet.arc.network",
    ws: null,
  },
  drpc: {
    http: "https://rpc.drpc.testnet.arc.network",
    ws: "wss://rpc.drpc.testnet.arc.network",
  },
  quicknode: {
    http: "https://rpc.quicknode.testnet.arc.network",
    ws: "wss://rpc.quicknode.testnet.arc.network",
  },
} as const;

export const ARC_TESTNET_EXPLORER = "https://testnet.arcscan.app";
export const ARC_TESTNET_GAS_TRACKER = "https://testnet.arcscan.app/gas-tracker";
export const ARC_TESTNET_FAUCET = "https://faucet.circle.com";

/**
 * Contract addresses on Arc Testnet.
 *
 * `usdc`, `eurc`, `usyc` are the ERC-20 interfaces on the native stablecoins.
 * USDC's ERC-20 interface (0x36...00) maps to the same underlying balance as
 * the native gas token — see the "Stablecoin native model" docs page.
 */
export const ARC_TESTNET_CONTRACTS = {
  /** Native USDC (ERC-20 interface for the gas token). 6 decimals. */
  usdc: "0x3600000000000000000000000000000000000000",
  /** EURC stablecoin (ERC-20). */
  eurc: "0x3700000000000000000000000000000000000000",
  /** USYC yield-bearing stablecoin. */
  usyc: "0x3800000000000000000000000000000000000000",
  /** Circle CCTP TokenMessenger entrypoint. */
  cctpTokenMessenger: "0x3900000000000000000000000000000000000000",
  /** Circle Gateway wallet for unified balance reads/transfers. */
  gateway: "0x3A00000000000000000000000000000000000000",
  /** StableFX router (USDC ↔ EURC, USDC ↔ USYC). */
  stableFx: "0x3B00000000000000000000000000000000000000",
  /** ERC-7677 paymaster (gas paid in USDC). */
  paymaster: "0x3C00000000000000000000000000000000000000",
  /** Transaction extensions — Memo. */
  memo: "0x3D00000000000000000000000000000000000000",
  /** Transaction extensions — Multicall3From. */
  multicall3From: "0x3E00000000000000000000000000000000000000",
  /** Common Ethereum infra — CREATE2 factory (deterministic). */
  create2Factory: "0x4e59b44847b379578588920cA78FbF26c0B4956C",
  /** Common Ethereum infra — Multicall3. */
  multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11",
  /** Common Ethereum infra — Permit2. */
  permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
} as const;

export type ArcContractKey = keyof typeof ARC_TESTNET_CONTRACTS;

/**
 * Viem-compatible chain object for `createPublicClient`, `createWalletClient`,
 * and Circle wallet RPC config.
 */
export const arcTestnetChain = {
  id: ARC_TESTNET_CHAIN_ID,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: [ARC_TESTNET_RPC.primary.http] },
    public: { http: [ARC_TESTNET_RPC.primary.http] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: ARC_TESTNET_EXPLORER },
  },
  testnet: true,
} as const;

export function explorerTx(hash: string): string {
  return `${ARC_TESTNET_EXPLORER}/tx/${hash}`;
}

export function explorerAddress(addr: string): string {
  return `${ARC_TESTNET_EXPLORER}/address/${addr}`;
}
