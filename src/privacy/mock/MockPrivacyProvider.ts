import type {
  PrivacyProvider,
  CreateWalletInput,
  LoadWalletInput,
  PrivateWalletInfo,
  PrivateBalance,
  PublicToPrivatePaymentInput,
  PreparedPayment,
  SubmitPaymentInput,
  SubmittedPayment,
  IncomingPrivatePayment,
  PaymentStatusInput,
  WithdrawInput,
} from "../types";
// getRandomValues also works on the public HTTP mock preview. randomUUID
// is restricted to secure contexts, so format the UUID from secure random bytes.
function randomMockUUID(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export class MockPrivacyProvider implements PrivacyProvider {
  private wallet: PrivateWalletInfo | null = null;
  private payments = new Map<string, SubmittedPayment>();
  private incoming: IncomingPrivatePayment[] = [];
  async initialize() {}
  async createPrivateWallet(input: CreateWalletInput) {
    if (!input.password || !input.mnemonic)
      throw new Error("Wallet credentials required");
    this.wallet = {
      id: randomMockUUID(),
      address: "mock-0zk-" + randomMockUUID(),
      provider: "mock",
    };
    return this.wallet;
  }
  async loadPrivateWallet(_input: LoadWalletInput) {
    void _input;
    if (!this.wallet) throw new Error("No mock wallet loaded");
    return this.wallet;
  }
  async getPrivateAddress() {
    if (!this.wallet) throw new Error("Create a mock wallet first");
    return this.wallet.address;
  }
  async getBalances(): Promise<PrivateBalance[]> {
    return this.incoming.map((p) => ({
      tokenAddress: p.tokenAddress,
      amountAtomic: p.amountAtomic,
      state: p.state,
    }));
  }
  async preparePublicToPrivatePayment(
    input: PublicToPrivatePaymentInput,
  ): Promise<PreparedPayment> {
    if (input.chainId !== 56 || BigInt(input.amountAtomic) <= 0n)
      throw new Error("Invalid payment");
    return {
      reference: input.reference,
      amountAtomic: input.amountAtomic,
      approvalAmountAtomic: input.amountAtomic,
      applicationFeeAtomic: "0",
      protocolFeeAtomic: "0",
      provider: "mock",
    };
  }
  async submitPublicToPrivatePayment({ prepared }: SubmitPaymentInput) {
    const prior = this.payments.get(prepared.reference);
    if (prior) return prior;
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const result = {
      txHash:
        "0x" +
        Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(""),
      reference: prepared.reference,
    };
    this.payments.set(prepared.reference, result);
    return result;
  }
  async reconcileIncomingPayments() {
    return this.incoming;
  }
  recordIncoming(payment: IncomingPrivatePayment) {
    if (!this.incoming.some((p) => p.noteId === payment.noteId))
      this.incoming.push(payment);
  }
  async getPaymentStatus(input: PaymentStatusInput) {
    return this.payments.has(input.reference)
      ? ("confirmed" as const)
      : ("pending" as const);
  }
  async withdraw(input: WithdrawInput) {
    if (BigInt(input.amountAtomic) <= 0n) throw new Error("Invalid amount");
    const available = this.incoming
      .filter(
        (p) => p.tokenAddress === input.tokenAddress && p.state === "spendable",
      )
      .reduce((a, p) => a + BigInt(p.amountAtomic), 0n);
    if (available < BigInt(input.amountAtomic))
      throw new Error("Insufficient spendable private balance");
    return this.submitPublicToPrivatePayment({
      prepared: {
        reference: randomMockUUID(),
        amountAtomic: input.amountAtomic,
        approvalAmountAtomic: "0",
        applicationFeeAtomic: "0",
        protocolFeeAtomic: "0",
        provider: "mock",
      },
    });
  }
}
