/**
 * Circle Developer-Controlled Wallets client.
 *
 * Reads creds from env (`CIRCLE_API_KEY`, `CIRCLE_ENTITY_SECRET`) and exposes a
 * singleton SDK client + helpers for the wallets Argo needs on Arc Testnet:
 *
 *   - one wallet per venue (hl, binance, chainlink, …) for working USDC
 *   - one "treasury" wallet that holds the unified USDC + USYC parking float
 *
 * Until creds are configured, every helper here throws with a clear message so
 * the rest of the app can decide whether to fall back to synthesized treasury.
 *
 * Env contract (.env.local):
 *   CIRCLE_API_KEY=TEST_API_KEY:...
 *   CIRCLE_ENTITY_SECRET=<32-byte hex from Circle dev console>
 *   CIRCLE_WALLET_SET_ID=<id returned by createWalletSet, optional — auto-created on first use>
 *
 * NOTE: The Circle SDK is dynamically imported so the build succeeds even
 * before `@circle-fin/developer-controlled-wallets` is installed. The wallet
 * routes simply 503 until you `npm i @circle-fin/developer-controlled-wallets`
 * and set the env vars.
 */

import { ARC_TESTNET_CHAIN_ID } from "./arc";

export const CIRCLE_BLOCKCHAIN_ARC_TESTNET = "ARC-TESTNET" as const;

export type CircleConfigStatus =
  | { ok: true; entitySecretConfigured: true; apiKeyConfigured: true }
  | { ok: false; reason: string };

export function circleConfigStatus(): CircleConfigStatus {
  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;
  if (!apiKey) return { ok: false, reason: "CIRCLE_API_KEY not set" };
  if (!entitySecret) return { ok: false, reason: "CIRCLE_ENTITY_SECRET not set" };
  return { ok: true, entitySecretConfigured: true, apiKeyConfigured: true };
}

type CircleClient = {
  createWalletSet: (args: { name: string }) => Promise<{
    data?: { walletSet?: { id: string } };
  }>;
  createWallets: (args: {
    blockchains: string[];
    count: number;
    walletSetId: string;
    accountType?: "SCA" | "EOA";
    metadata?: { name?: string; refId?: string }[];
  }) => Promise<{
    data?: { wallets?: Array<{ id: string; address: string; blockchain: string }> };
  }>;
  listWallets: (args?: { walletSetId?: string }) => Promise<{
    data?: { wallets?: Array<{ id: string; address: string; blockchain: string }> };
  }>;
  getWalletTokenBalance: (args: { id: string }) => Promise<{
    data?: { tokenBalances?: Array<{ token: { symbol: string }; amount: string }> };
  }>;
};

let _client: CircleClient | null = null;

async function getCircleClient(): Promise<CircleClient> {
  if (_client) return _client;
  const status = circleConfigStatus();
  if (!status.ok) throw new Error(`circle: ${status.reason}`);

  // Lazy import so missing dep doesn't break build. The package name is
  // assembled at runtime so TypeScript doesn't try to resolve it at build time
  // (it's an optional dependency the operator installs when wiring Circle).
  let mod: unknown;
  try {
    const pkg = ["@circle-fin", "developer-controlled-wallets"].join("/");
    mod = await import(/* webpackIgnore: true */ /* @vite-ignore */ pkg);
  } catch {
    throw new Error(
      "circle: @circle-fin/developer-controlled-wallets not installed. " +
        "Run: npm i @circle-fin/developer-controlled-wallets",
    );
  }
  const initiate = (mod as {
    initiateDeveloperControlledWalletsClient: (opts: {
      apiKey: string;
      entitySecret: string;
    }) => CircleClient;
  }).initiateDeveloperControlledWalletsClient;

  _client = initiate({
    apiKey: process.env.CIRCLE_API_KEY!,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
  });
  return _client;
}

/**
 * Ensure a WalletSet exists for Argo. Idempotent: returns the env-pinned id if
 * present, else creates one named "argo-arbitrage" and instructs the operator
 * to paste it into env.
 */
export async function ensureWalletSet(): Promise<string> {
  const pinned = process.env.CIRCLE_WALLET_SET_ID;
  if (pinned) return pinned;

  const client = await getCircleClient();
  const res = await client.createWalletSet({ name: "argo-arbitrage" });
  const id = res.data?.walletSet?.id;
  if (!id) throw new Error("circle: createWalletSet returned no id");
  console.warn(
    `circle: created walletSet ${id} — pin this in env as CIRCLE_WALLET_SET_ID`,
  );
  return id;
}

/**
 * Provision one Circle Wallet per venue on Arc Testnet, plus a treasury wallet.
 *
 * Returns the addresses so the caller can hand them to the user for funding
 * (via the Circle faucet at faucet.circle.com).
 */
export async function provisionArgoWallets(venueIds: string[]): Promise<{
  walletSetId: string;
  wallets: Array<{
    refId: string;
    address: string;
    walletId: string;
    chainId: number;
  }>;
}> {
  const walletSetId = await ensureWalletSet();
  const client = await getCircleClient();

  const refIds = ["treasury", ...venueIds];
  const metadata = refIds.map((refId) => ({
    name: `argo-${refId}`,
    refId,
  }));

  const res = await client.createWallets({
    blockchains: [CIRCLE_BLOCKCHAIN_ARC_TESTNET],
    count: refIds.length,
    walletSetId,
    accountType: "SCA",
    metadata,
  });

  const created = res.data?.wallets ?? [];
  return {
    walletSetId,
    wallets: created.map((w, i) => ({
      refId: refIds[i] ?? "unknown",
      address: w.address,
      walletId: w.id,
      chainId: ARC_TESTNET_CHAIN_ID,
    })),
  };
}

/**
 * List wallets in the configured WalletSet, with their USDC/EURC/USYC balances.
 */
export async function listArgoWallets(): Promise<
  Array<{
    walletId: string;
    address: string;
    blockchain: string;
    balances: Record<string, number>;
  }>
> {
  const client = await getCircleClient();
  const walletSetId = process.env.CIRCLE_WALLET_SET_ID;
  const listed = await client.listWallets(
    walletSetId ? { walletSetId } : undefined,
  );
  const wallets = listed.data?.wallets ?? [];

  const out = await Promise.all(
    wallets.map(async (w) => {
      const bal = await client
        .getWalletTokenBalance({ id: w.id })
        .catch(() => ({ data: { tokenBalances: [] as Array<{ token: { symbol: string }; amount: string }> } }));
      const balances: Record<string, number> = {};
      for (const b of bal.data?.tokenBalances ?? []) {
        const n = parseFloat(b.amount);
        if (Number.isFinite(n)) balances[b.token.symbol] = n;
      }
      return {
        walletId: w.id,
        address: w.address,
        blockchain: w.blockchain,
        balances,
      };
    }),
  );
  return out;
}
