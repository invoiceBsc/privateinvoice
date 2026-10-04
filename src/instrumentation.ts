// Starts the RAILGUN payment verifier alongside the Node server (real-payment mode only).
export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.PRIVACY_PROVIDER === "railgun"
  ) {
    const { startVerifier } = await import("./server/railgun/verifier");
    startVerifier();
  }
}
