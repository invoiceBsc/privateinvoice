const worker = new Worker(new URL("./worker.ts", import.meta.url), {
  type: "module",
});
interface PendingRequest {
  resolve: (value: Record<string, unknown>) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}
const pending = new Map<number, PendingRequest>();
let sequence = 0;
const element = (id: string) => document.getElementById(id)!;
const value = (id: string) => (element(id) as HTMLInputElement).value;
function stopWorker(message: string) {
  worker.terminate();
  for (const request of pending.values()) {
    clearTimeout(request.timer);
    request.reject(new Error(message));
  }
  pending.clear();
}
worker.onerror = () =>
  stopWorker(
    "Privacy worker stopped. Reload this research page to retry. No transaction was sent.",
  );
worker.onmessage = (e) => {
  if (e.data.stage) element("stage").textContent = e.data.stage;
  if (e.data.balances)
    element("balances").textContent = JSON.stringify(
      e.data.balances,
      (_key, v) => (typeof v === "bigint" ? v.toString() : v),
      2,
    );
  const request = pending.get(e.data.id);
  if (request) {
    pending.delete(e.data.id);
    clearTimeout(request.timer);
    if (e.data.error) request.reject(new Error(e.data.error));
    else request.resolve(e.data.result);
  }
};
async function call(type: string, data: Record<string, unknown> = {}) {
  const id = ++sequence;
  const result = new Promise<Record<string, unknown>>((resolve, reject) => {
    const timer = setTimeout(
      () =>
        stopWorker(
          "Operation timed out. Reload this research page to retry. Scan completeness is not confirmed. No transaction was sent.",
        ),
      type === "scan" ? 60000 : 120000,
    );
    pending.set(id, { resolve, reject, timer });
  });
  worker.postMessage({ id, type, ...data });
  return result;
}
const action = (id: string, run: () => Promise<unknown>) =>
  element(id).addEventListener("click", async () => {
    (element(id) as HTMLButtonElement).disabled = true;
    element("error").textContent = "";
    try {
      const result = await run();
      if (result)
        element("result").textContent = JSON.stringify(result, null, 2);
    } catch (e) {
      element("error").textContent =
        e instanceof Error ? e.message : "Operation failed";
    } finally {
      (element(id) as HTMLButtonElement).disabled = false;
    }
  });
action("initialize", () => call("initialize"));
action("generate", async () => {
  const result = await call("generate");
  (element("mnemonic") as HTMLTextAreaElement).value = String(result.mnemonic);
  element("result").textContent =
    "Recovery phrase generated locally. Back it up before continuing.";
  return null;
});
action("create", async () => {
  if (!(element("backup") as HTMLInputElement).checked)
    throw new Error("Confirm your recovery backup first");
  const result = await call("create", {
    password: value("password"),
    mnemonic: value("mnemonic"),
  });
  (element("recipient") as HTMLInputElement).value = String(result.address);
  (element("mnemonic") as HTMLTextAreaElement).value = "";
  (element("password") as HTMLInputElement).value = "";
  return result;
});
action("load", async () => {
  const result = await call("load", { password: value("password") });
  (element("password") as HTMLInputElement).value = "";
  (element("recipient") as HTMLInputElement).value = String(result.address);
  return result;
});
action("network", () => call("network", { rpcURL: value("rpc") }));
action("scan", () => call("scan"));
action("shield", () =>
  call("shield", {
    recipient: value("recipient"),
    tokenAddress: value("token"),
    amount: value("amount"),
  }),
);
window.addEventListener("beforeunload", () => worker.terminate());
