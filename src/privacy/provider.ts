import { MockPrivacyProvider } from "./mock/MockPrivacyProvider";
import { RailgunPrivacyProvider } from "./railgun/RailgunPrivacyProvider";
export const privacyProvider =
  process.env.NEXT_PUBLIC_PRIVACY_PROVIDER === "railgun"
    ? new RailgunPrivacyProvider()
    : new MockPrivacyProvider();
