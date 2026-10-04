import type { PublicClient, Hash } from "viem";
import { CONFIRMATIONS } from "@/config/chains";
/** Future real-payment gate. A valid receipt alone never proves that the merchant received a note. */
export async function validateChainEvidence(
  client: PublicClient,
  input: { txHash: Hash; proxyAddress: string; payerAddress: string },
) {
  if ((await client.getChainId()) !== 56) throw new Error("Wrong chain");
  const [receipt, transaction, head] = await Promise.all([
    client.getTransactionReceipt({ hash: input.txHash }),
    client.getTransaction({ hash: input.txHash }),
    client.getBlockNumber(),
  ]);
  if (receipt.status !== "success") throw new Error("Transaction reverted");
  if (
    transaction.chainId !== 56 ||
    transaction.to?.toLowerCase() !== input.proxyAddress.toLowerCase() ||
    transaction.from.toLowerCase() !== input.payerAddress.toLowerCase()
  )
    throw new Error("Transaction context does not match");
  if (head < receipt.blockNumber + BigInt(CONFIRMATIONS - 1))
    throw new Error("Confirmations pending");
  const canonical = await client.getBlock({ blockNumber: receipt.blockNumber });
  if (canonical.hash !== receipt.blockHash)
    throw new Error("Transaction was reorganized");
  return {
    blockNumber: receipt.blockNumber.toString(),
    blockHash: receipt.blockHash,
  };
}
