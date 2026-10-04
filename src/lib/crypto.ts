import {
  createHash,
  createHmac,
  createPrivateKey,
  createPublicKey,
  randomBytes,
  timingSafeEqual,
  sign,
} from "node:crypto";
export const randomToken = () => randomBytes(32).toString("hex");
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export function sessionHash(value: string) {
  const key = process.env.SESSION_SECRET;
  if (!key || key.length < 32)
    throw new Error("Session secret is not configured");
  return createHmac("sha256", key).update(value).digest("hex");
}
export const equalHash = (left: string, right: string) =>
  left.length === right.length &&
  timingSafeEqual(Buffer.from(left), Buffer.from(right));
export function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  const record = value as Record<string, unknown>;
  return (
    "{" +
    Object.keys(record)
      .sort()
      .map((k) => JSON.stringify(k) + ":" + canonical(record[k]))
      .join(",") +
    "}"
  );
}
export function signReceipt(payload: unknown) {
  const seed = process.env.RECEIPT_SIGNING_KEY;
  if (!seed || !/^[0-9a-f]{64}$/.test(seed))
    throw new Error("Receipt signing is not configured");
  const key = createPrivateKey({
    key: Buffer.concat([
      Buffer.from("302e020100300506032b657004220420", "hex"),
      Buffer.from(seed, "hex"),
    ]),
    format: "der",
    type: "pkcs8",
  });
  const payloadHash = hash(canonical(payload));
  return {
    payloadHash,
    signature: sign(null, Buffer.from(payloadHash, "hex"), key).toString(
      "base64",
    ),
    publicKey: createPublicKey(key)
      .export({ format: "pem", type: "spki" })
      .toString(),
  };
}
export function receiptPublicKey() {
  const seed = process.env.RECEIPT_SIGNING_KEY;
  if (!seed || !/^[0-9a-f]{64}$/.test(seed))
    throw new Error("Receipt signing is not configured");
  const key = createPrivateKey({
    key: Buffer.concat([
      Buffer.from("302e020100300506032b657004220420", "hex"),
      Buffer.from(seed, "hex"),
    ]),
    format: "der",
    type: "pkcs8",
  });
  return createPublicKey(key)
    .export({ format: "pem", type: "spki" })
    .toString();
}
