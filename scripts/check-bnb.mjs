import { createPublicClient, http, parseAbi } from "viem";
import { bsc } from "viem/chains";
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const {
  NETWORK_CONFIG,
  NetworkName,
} = require("@railgun-community/shared-models");
const config = NETWORK_CONFIG[NetworkName.BNBChain];
const rpc =
  process.env.NEXT_PUBLIC_BNB_RPC_URL ?? "https://bsc-dataseed.bnbchain.org";
const client = createPublicClient({
  chain: bsc,
  transport: http(rpc, { timeout: 12000, retryCount: 1 }),
});
const results = {
  timestamp: new Date().toISOString(),
  rpc,
  network: config,
  tokens: [],
  error: null,
};
try {
  results.chainId = await client.getChainId();
  results.blockNumber = (await client.getBlockNumber()).toString();
  for (const [symbol, address] of [
    ["USDT", "0x55d398326f99059fF775485246999027B3197955"],
    ["USDC", "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"],
  ]) {
    const [code, decimals, onchainSymbol] = await Promise.all([
      client.getCode({ address }),
      client.readContract({
        address,
        abi: parseAbi(["function decimals() view returns (uint8)"]),
        functionName: "decimals",
      }),
      client.readContract({
        address,
        abi: parseAbi(["function symbol() view returns (string)"]),
        functionName: "symbol",
      }),
    ]);
    results.tokens.push({
      symbol,
      address,
      decimals,
      onchainSymbol,
      hasCode: !!code && code !== "0x",
    });
  }
  results.shieldFeeBps = (
    await client.readContract({
      address: config.proxyContract,
      abi: parseAbi(["function shieldFee() view returns (uint256)"]),
      functionName: "shieldFee",
    })
  ).toString();
} catch {
  results.error = "RPC read check failed; no on-chain acceptance claim.";
}
fs.mkdirSync("research", { recursive: true });
fs.writeFileSync(
  "research/bnb-read-check.json",
  JSON.stringify(results, null, 2),
);
console.log(
  JSON.stringify({
    chainId: results.chainId,
    tokens: results.tokens,
    shieldFeeBps: results.shieldFeeBps,
    error: results.error,
  }),
);
