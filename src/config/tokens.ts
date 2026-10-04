import type { Address } from "viem";
export const TOKENS = {
  USDT: {
    symbol: "USDT",
    label: "Binance-Peg USDT",
    address: "0x55d398326f99059fF775485246999027B3197955" as Address,
    decimals: 18,
  },
  USDC: {
    symbol: "USDC",
    label: "Binance-Peg USDC",
    address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d" as Address,
    decimals: 18,
  },
} as const;
export type TokenSymbol = keyof typeof TOKENS;
