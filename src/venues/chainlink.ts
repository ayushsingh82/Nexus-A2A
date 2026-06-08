/**
 * Chainlink price-feed reader.
 *
 * Queries the Chainlink Aggregator V3 contracts on Ethereum mainnet via a
 * public RPC. No auth, no keys. The feeds are the canonical price oracle for
 * a huge chunk of DeFi, so they make a useful third reference alongside the
 * CEX venues for the arb graph.
 *
 * Reads:
 *   ETH/USD  0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
 *   BTC/USD  0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c
 *   EUR/USD  0xb49f677943BC038e9857d61E7d053CaA2C1734C1
 *
 * Each call is a single JSON-RPC `eth_call` to `latestRoundData()` which
 * returns `(roundId, answer, startedAt, updatedAt, answeredInRound)`. The
 * `answer` is scaled by `decimals()` (8 for USD-quoted feeds).
 *
 * We pin a single public Cloudflare RPC and fall back to LlamaNodes if it 4xxs.
 * Both are free, rate-limited, and require no signup.
 */

const ETH_RPCS = [
  "https://cloudflare-eth.com",
  "https://eth.llamarpc.com",
  "https://rpc.ankr.com/eth",
];

const FEEDS = {
  ETH: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
  BTC: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
  EUR: "0xb49f677943BC038e9857d61E7d053CaA2C1734C1",
} as const;

// Function selector for `latestRoundData()` = keccak256("latestRoundData()")[:8]
const LATEST_ROUND_DATA_SELECTOR = "0xfeaf968c";
// All three feeds use 8 decimals.
const FEED_DECIMALS = 8;

export type ChainlinkQuotes = {
  ETH: number;
  BTC: number;
  EUR: number;
  fetchedAtMs: number;
};

async function rpcCall<T>(method: string, params: unknown[]): Promise<T> {
  let lastErr: unknown;
  for (const url of ETH_RPCS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        cache: "no-store",
      });
      if (!res.ok) {
        lastErr = new Error(`${url} ${res.status}`);
        continue;
      }
      const json = (await res.json()) as { result?: T; error?: { message: string } };
      if (json.error) {
        lastErr = new Error(`${url} ${json.error.message}`);
        continue;
      }
      if (json.result !== undefined) return json.result;
      lastErr = new Error(`${url} empty result`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`chainlink rpc: all endpoints failed — ${String(lastErr)}`);
}

function decodeInt256(hex: string): bigint {
  // Returned data from latestRoundData is 5 × 32-byte words; answer is word #2.
  const stripped = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (stripped.length < 64 * 2) throw new Error("chainlink: short return data");
  const word = stripped.slice(64, 128);
  // int256 — handle two's complement.
  const isNegative = parseInt(word.slice(0, 1), 16) >= 8;
  if (!isNegative) return BigInt("0x" + word);
  const inverted = [...word]
    .map((c) => (15 - parseInt(c, 16)).toString(16))
    .join("");
  return -(BigInt("0x" + inverted) + 1n);
}

async function readFeed(addr: string): Promise<number> {
  const data = await rpcCall<string>("eth_call", [
    { to: addr, data: LATEST_ROUND_DATA_SELECTOR },
    "latest",
  ]);
  const answer = decodeInt256(data);
  return Number(answer) / 10 ** FEED_DECIMALS;
}

export async function fetchChainlinkQuotes(): Promise<ChainlinkQuotes> {
  const [eth, btc, eur] = await Promise.all([
    readFeed(FEEDS.ETH).catch(() => 0),
    readFeed(FEEDS.BTC).catch(() => 0),
    readFeed(FEEDS.EUR).catch(() => 0),
  ]);
  return { ETH: eth, BTC: btc, EUR: eur, fetchedAtMs: Date.now() };
}
