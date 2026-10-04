import { z } from "zod";
import { isAddress, parseUnits } from "viem";
import { TOKENS } from "@/config/tokens";
export const address = z
  .string()
  .refine(isAddress, "Invalid EVM address")
  .transform((a) => a.toLowerCase());
export const uuid = z.string().uuid();
export const nonceInput = z.object({ address }).strict();
export const verifyInput = z
  .object({
    nonce: z.string().length(64),
    address,
    signature: z
      .string()
      .regex(/^0x[0-9a-fA-F]+$/)
      .max(512),
  })
  .strict();
export const merchantInput = z
  .object({
    displayName: z.string().min(1).max(80),
    railgunAddress: z.string().min(10).max(256),
  })
  .strict();
export const invoiceInput = z
  .object({
    amount: z.string().regex(/^(?:0|[1-9][0-9]{0,17})(?:\.[0-9]{1,18})?$/),
    tokenSymbol: z.enum(["USDT", "USDC"]),
    description: z.string().min(1).max(500),
    customerLabel: z.string().max(80).default(""),
    expiresInDays: z.number().int().min(1).max(90).default(7),
  })
  .strict()
  .superRefine((v, c) => {
    if (
      /^(?:0|[1-9][0-9]{0,17})(?:\.[0-9]{1,18})?$/.test(v.amount) &&
      parseUnits(v.amount, TOKENS[v.tokenSymbol].decimals) <= 0n
    )
      c.addIssue({
        code: "custom",
        message: "Amount must be greater than zero",
        path: ["amount"],
      });
  });
export const attemptInput = z
  .object({
    payerAddress: address,
    chainId: z.literal(56),
    tokenAddress: address,
    amountAtomic: z
      .string()
      .regex(/^[1-9][0-9]*$/)
      .max(78),
  })
  .strict();
export const shieldAttemptInput = z
  .object({ payerAddress: address, chainId: z.literal(56) })
  .strict();
export const submitInput = z
  .object({
    capability: z.string().length(64),
    txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
    chainId: z.literal(56),
  })
  .strict();
export const reconcileInput = z
  .object({
    noteId: z.string().min(1).max(128),
    txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
    chainId: z.literal(56),
    tokenAddress: address,
    amountAtomic: z
      .string()
      .regex(/^[1-9][0-9]*$/)
      .max(78),
  })
  .strict();
export const patchInput = z.object({ status: z.literal("CANCELLED") }).strict();
export const withdrawalInput = z
  .object({
    tokenSymbol: z.enum(["USDT", "USDC"]),
    amount: z.string().regex(/^[0-9]+(?:\.[0-9]{1,18})?$/),
    destination: address,
  })
  .strict();
