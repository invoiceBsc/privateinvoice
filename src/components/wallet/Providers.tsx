"use client";
import { useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { bsc } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const config = createConfig({
  chains: [bsc],
  connectors: [injected()],
  transports: { [bsc.id]: http(process.env.NEXT_PUBLIC_BNB_RPC_URL) },
  ssr: true,
});
export function Providers({ children }: { children: React.ReactNode }) {
  const [query] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={query}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
