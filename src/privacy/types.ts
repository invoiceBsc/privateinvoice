export type BalanceState = "spendable" | "pending" | "blocked";
export interface PrivateWalletInfo {
  id: string;
  address: string;
  provider: "mock" | "railgun";
}
export interface CreateWalletInput {
  mnemonic: string;
  password: string;
}
export interface LoadWalletInput {
  password: string;
}
export interface PrivateBalance {
  tokenAddress: string;
  amountAtomic: string;
  state: BalanceState;
}
export interface PublicToPrivatePaymentInput {
  recipient: string;
  tokenAddress: string;
  amountAtomic: string;
  chainId: 56;
  reference: string;
}
export interface PreparedPayment {
  reference: string;
  amountAtomic: string;
  approvalAmountAtomic: string;
  applicationFeeAtomic: "0";
  protocolFeeAtomic: string;
  provider: "mock" | "railgun";
}
export interface SubmitPaymentInput {
  prepared: PreparedPayment;
}
export interface SubmittedPayment {
  txHash: string;
  reference: string;
}
export interface IncomingPrivatePayment {
  noteId: string;
  txHash: string;
  tokenAddress: string;
  amountAtomic: string;
  chainId: 56;
  state: BalanceState;
}
export interface PaymentStatusInput {
  reference: string;
}
export type PrivacyPaymentStatus =
  "pending" | "confirmed" | "spendable" | "failed";
export interface WithdrawInput {
  tokenAddress: string;
  amountAtomic: string;
  destination: string;
}
export interface PrivacyProvider {
  initialize(): Promise<void>;
  createPrivateWallet(input: CreateWalletInput): Promise<PrivateWalletInfo>;
  loadPrivateWallet(input: LoadWalletInput): Promise<PrivateWalletInfo>;
  getPrivateAddress(): Promise<string>;
  getBalances(): Promise<PrivateBalance[]>;
  preparePublicToPrivatePayment(
    input: PublicToPrivatePaymentInput,
  ): Promise<PreparedPayment>;
  submitPublicToPrivatePayment(
    input: SubmitPaymentInput,
  ): Promise<SubmittedPayment>;
  reconcileIncomingPayments(): Promise<IncomingPrivatePayment[]>;
  getPaymentStatus(input: PaymentStatusInput): Promise<PrivacyPaymentStatus>;
  withdraw(input: WithdrawInput): Promise<SubmittedPayment>;
}
