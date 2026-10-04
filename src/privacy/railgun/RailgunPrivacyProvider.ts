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
  PrivacyPaymentStatus,
  WithdrawInput,
} from "../types";
/** Fail closed until browser storage, POI and note reconciliation pass the documented spike. */
export class RailgunPrivacyProvider implements PrivacyProvider {
  private unavailable(): never {
    throw new Error(
      "Real payments are disabled: RAILGUN browser integration has not passed acceptance tests.",
    );
  }
  async initialize(): Promise<void> {
    this.unavailable();
  }
  async createPrivateWallet(
    _input: CreateWalletInput,
  ): Promise<PrivateWalletInfo> {
    void _input;
    return this.unavailable();
  }
  async loadPrivateWallet(_input: LoadWalletInput): Promise<PrivateWalletInfo> {
    void _input;
    return this.unavailable();
  }
  async getPrivateAddress(): Promise<string> {
    return this.unavailable();
  }
  async getBalances(): Promise<PrivateBalance[]> {
    return this.unavailable();
  }
  async preparePublicToPrivatePayment(
    _input: PublicToPrivatePaymentInput,
  ): Promise<PreparedPayment> {
    void _input;
    return this.unavailable();
  }
  async submitPublicToPrivatePayment(
    _input: SubmitPaymentInput,
  ): Promise<SubmittedPayment> {
    void _input;
    return this.unavailable();
  }
  async reconcileIncomingPayments(): Promise<IncomingPrivatePayment[]> {
    return this.unavailable();
  }
  async getPaymentStatus(
    _input: PaymentStatusInput,
  ): Promise<PrivacyPaymentStatus> {
    void _input;
    return this.unavailable();
  }
  async withdraw(_input: WithdrawInput): Promise<SubmittedPayment> {
    void _input;
    return this.unavailable();
  }
}
