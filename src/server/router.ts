import { mockBalances } from "./payments/mock-balances";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifyMessage, parseUnits } from "viem";
import { db } from "@/lib/db";
import { hash, sessionHash, randomToken, equalHash } from "@/lib/crypto";
import * as v from "@/lib/validation";
import { TOKENS } from "@/config/tokens";
import {
  ApiError,
  guardRequest,
  currentUser,
  requireUser,
  requireMerchant,
  createSession,
} from "./auth/session";
import {
  ownedInvoice,
  expireInvoices,
  requirePayable,
  publicInvoice,
} from "./invoices/service";
import { reconcileMock } from "./payments/service";
import {
  RAILGUN_PROXY,
  buildShield,
  grossForNet,
  isRailgunAddress,
  shieldFeeBps,
} from "./railgun/shield";
import { settleAttempt } from "./railgun/verifier";
const railgunMode = () => process.env.PRIVACY_PROVIDER === "railgun";
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
async function body<T>(req: Request, schema: z.ZodType<T>) {
  if (Number(req.headers.get("content-length") ?? 0) > 16384)
    throw new ApiError(413, "Request too large");
  const text = await req.text();
  if (text.length > 16384) throw new ApiError(413, "Request too large");
  return schema.parse(JSON.parse(text));
}
export async function route(req: Request, path: string[]) {
  try {
    await guardRequest(req);
    const method = req.method;
    const key = path.join("/");
    await expireInvoices();
    if (key === "auth/nonce" && method === "POST") {
      const input = await body(req, v.nonceInput);
      const nonce = randomToken();
      const expiresAt = new Date(Date.now() + 300000);
      const message = `Private Invoice wallet sign-in\nOrigin: ${process.env.APP_ORIGIN}\nAddress: ${input.address}\nChain ID: 56\nNonce: ${nonce}\nExpires: ${expiresAt.toISOString()}`;
      await db.authNonce.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      await db.authNonce.create({
        data: { id: nonce, address: input.address, message, expiresAt },
      });
      return json({ nonce, message });
    }
    if (key === "auth/verify" && method === "POST") {
      const input = await body(req, v.verifyInput);
      const nonce = await db.authNonce.findUnique({
        where: { id: input.nonce },
      });
      if (
        !nonce ||
        nonce.address !== input.address ||
        nonce.consumedAt ||
        nonce.expiresAt <= new Date()
      )
        throw new ApiError(401, "Login challenge is invalid or expired");
      const valid = await verifyMessage({
        address: input.address as `0x${string}`,
        message: nonce.message,
        signature: input.signature as `0x${string}`,
      });
      if (!valid) throw new ApiError(401, "Invalid wallet signature");
      const claimed = await db.authNonce.updateMany({
        where: {
          id: nonce.id,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { consumedAt: new Date() },
      });
      if (claimed.count !== 1)
        throw new ApiError(401, "Login challenge already used");
      const user = await db.user.upsert({
        where: { evmAddress: input.address },
        create: { evmAddress: input.address },
        update: {},
      });
      await createSession(user.id);
      return json({ authenticated: true });
    }
    if (key === "auth/logout" && method === "POST") {
      await body(req, z.object({}).strict());
      const jar = await cookies();
      const token = jar.get("invoice_session")?.value;
      if (token)
        await db.session.deleteMany({ where: { id: sessionHash(token) } });
      jar.delete("invoice_session");
      return json({ ok: true });
    }
    if (key === "merchant") {
      if (method === "GET") {
        const user = await currentUser();
        return json({
          authenticated: !!user,
          address: user?.evmAddress ?? null,
          merchant: user?.merchant ?? null,
          provider: process.env.PRIVACY_PROVIDER ?? "mock",
        });
      }
      if (method === "POST" || method === "PATCH") {
        const user = await requireUser();
        const input = await body(req, v.merchantInput);
        if (railgunMode()) {
          if (!isRailgunAddress(input.railgunAddress))
            throw new ApiError(400, "Invalid RAILGUN address");
          input.railgunAddress = input.railgunAddress.trim();
        } else if (!input.railgunAddress.startsWith("mock-0zk-"))
          throw new ApiError(400, "Mock receiving address required");
        if (
          method === "PATCH" &&
          user.merchant &&
          user.merchant.railgunAddress !== input.railgunAddress
        )
          throw new ApiError(
            409,
            "Receiving address rotation is not supported",
          );
        return json(
          await db.merchant.upsert({
            where: { userId: user.id },
            create: { userId: user.id, ...input },
            update: { displayName: input.displayName },
          }),
        );
      }
    }
    if (key === "invoices" && method === "GET") {
      const merchant = await requireMerchant();
      return json(
        await db.invoice.findMany({
          where: { merchantId: merchant.id },
          orderBy: { createdAt: "desc" },
          include: { receipts: true },
        }),
      );
    }
    if (key === "invoices" && method === "POST") {
      const merchant = await requireMerchant();
      const input = await body(req, v.invoiceInput);
      const token = TOKENS[input.tokenSymbol];
      return json(
        await db.invoice.create({
          data: {
            merchantId: merchant.id,
            publicSlug: randomToken().slice(0, 32),
            invoiceNumber: "INV-" + randomToken().slice(0, 10).toUpperCase(),
            tokenSymbol: token.symbol,
            tokenAddress: token.address.toLowerCase(),
            decimals: token.decimals,
            amountAtomic: parseUnits(input.amount, token.decimals).toString(),
            description: input.description,
            customerLabel: input.customerLabel,
            expiresAt: new Date(Date.now() + input.expiresInDays * 86400000),
          },
        }),
        201,
      );
    }
    if (path[0] === "invoices" && path.length === 2) {
      const id = v.uuid.parse(path[1]);
      if (method === "GET") return json(await ownedInvoice(id));
      if (method === "PATCH") {
        await body(req, v.patchInput);
        await ownedInvoice(id);
        const result = await db.invoice.updateMany({
          where: {
            id,
            status: "PENDING",
            attempts: {
              none: {
                status: {
                  in: ["SUBMITTED", "CHAIN_CONFIRMED", "PRIVATE_NOTE_DETECTED"],
                },
              },
            },
          },
          data: { status: "CANCELLED" },
        });
        if (!result.count)
          throw new ApiError(409, "Invoice cannot be cancelled");
        return json({ ok: true });
      }
    }
    if (
      path[0] === "public" &&
      path[1] === "invoices" &&
      path.length === 3 &&
      method === "GET"
    ) {
      const slug = z
        .string()
        .regex(/^[a-f0-9]{32}$/)
        .parse(path[2]);
      const invoice = await db.invoice.findUnique({
        where: { publicSlug: slug },
        include: {
          merchant: { select: { displayName: true } },
          receipts: { select: { id: true } },
        },
      });
      if (!invoice) throw new ApiError(404, "Invoice not found");
      let quote = null;
      if (railgunMode() && invoice.status === "PENDING") {
        // Payer covers the RAILGUN shield fee so the merchant nets the invoice amount.
        const feeBps = await shieldFeeBps().catch(() => null);
        if (feeBps !== null) {
          const gross = grossForNet(BigInt(invoice.amountAtomic), feeBps);
          quote = {
            feeBps: Number(feeBps),
            grossAtomic: gross.toString(),
            feeAtomic: (gross - BigInt(invoice.amountAtomic)).toString(),
          };
        }
      }
      const paid = invoice.receipts.length
        ? await db.paymentAttempt.findFirst({
            where: { invoiceId: invoice.id, receipt: { isNot: null } },
            select: { txHash: true },
          })
        : null;
      return json({
        ...publicInvoice(invoice),
        receiptId: invoice.receipts[0]?.id ?? null,
        paymentTxHash: paid?.txHash ?? null,
        quote,
      });
    }
    if (
      path[0] === "invoices" &&
      path[2] === "payment-attempt" &&
      path.length === 3 &&
      method === "POST"
    ) {
      if (railgunMode()) {
        const id = v.uuid.parse(path[1]);
        const input = await body(req, v.shieldAttemptInput);
        const invoice = await db.invoice.findUnique({
          where: { id },
          include: { merchant: true },
        });
        if (!invoice) throw new ApiError(404, "Invoice not found");
        requirePayable(invoice);
        const shield = await buildShield(
          invoice.merchant.railgunAddress,
          invoice.tokenAddress,
          BigInt(invoice.amountAtomic),
        );
        const capability = randomToken();
        const payment = await db.paymentAttempt.create({
          data: {
            invoiceId: id,
            payerAddress: input.payerAddress,
            chainId: 56,
            tokenAddress: invoice.tokenAddress.toLowerCase(),
            amountAtomic: invoice.amountAtomic,
            grossAtomic: shield.grossAtomic,
            shieldPublicKey: shield.shieldPublicKey,
            notePublicKey: shield.notePublicKey,
            encryptedBundle: shield.encryptedBundle,
            createdBlock: shield.createdBlock,
            provider: "railgun",
            providerReference: crypto.randomUUID(),
            capabilityHash: hash(capability),
          },
        });
        return json(
          {
            id: payment.id,
            capability,
            provider: "railgun",
            tokenAddress: invoice.tokenAddress,
            netAtomic: invoice.amountAtomic,
            grossAtomic: shield.grossAtomic,
            feeAtomic: shield.feeAtomic,
            feeBps: shield.feeBps,
            spender: RAILGUN_PROXY,
            transaction: { to: RAILGUN_PROXY, data: shield.calldata },
          },
          201,
        );
      }
      if (process.env.PRIVACY_PROVIDER !== "mock")
        throw new ApiError(503, "Real payments are disabled");
      const id = v.uuid.parse(path[1]);
      const input = await body(req, v.attemptInput);
      const invoice = await db.invoice.findUnique({ where: { id } });
      if (!invoice) throw new ApiError(404, "Invoice not found");
      requirePayable(invoice);
      if (
        input.amountAtomic !== invoice.amountAtomic ||
        input.tokenAddress !== invoice.tokenAddress
      )
        throw new ApiError(
          400,
          "Payment must use the exact invoice token and amount",
        );
      const capability = randomToken();
      const payment = await db.paymentAttempt.create({
        data: {
          invoiceId: id,
          payerAddress: input.payerAddress,
          chainId: 56,
          tokenAddress: input.tokenAddress,
          amountAtomic: input.amountAtomic,
          provider: "mock",
          providerReference: crypto.randomUUID(),
          capabilityHash: hash(capability),
        },
      });
      return json(
        {
          id: payment.id,
          reference: payment.providerReference,
          capability,
          provider: "mock",
        },
        201,
      );
    }
    if (
      path[0] === "payments" &&
      path[2] === "submitted" &&
      path.length === 3 &&
      method === "POST"
    ) {
      if (railgunMode()) {
        const id = v.uuid.parse(path[1]);
        const input = await body(req, v.submitInput);
        const p = await db.paymentAttempt.findUnique({ where: { id } });
        if (!p || !equalHash(p.capabilityHash, hash(input.capability)))
          throw new ApiError(403, "Payment capability denied");
        if (p.txHash && p.txHash !== input.txHash)
          throw new ApiError(409, "Payment already submitted");
        // Funds may already be on their way: never refuse a real transaction hash.
        await db.$transaction([
          db.paymentAttempt.updateMany({
            where: { id, txHash: null },
            data: { txHash: input.txHash, status: "SUBMITTED" },
          }),
          db.invoice.updateMany({
            where: { id: p.invoiceId, status: { in: ["PENDING", "EXPIRED"] } },
            data: { status: "PAYMENT_SUBMITTED" },
          }),
        ]);
        void settleAttempt(id).catch(() => {});
        return json({ ok: true, status: "SUBMITTED" });
      }
      if (process.env.PRIVACY_PROVIDER !== "mock")
        throw new ApiError(503, "Real payments are disabled");
      const id = v.uuid.parse(path[1]);
      const input = await body(req, v.submitInput);
      const result = await db.$transaction(
        async (tx) => {
          const p = await tx.paymentAttempt.findUnique({
            where: { id },
            include: { invoice: true },
          });
          if (!p || !equalHash(p.capabilityHash, hash(input.capability)))
            throw new ApiError(403, "Payment capability denied");
          if (p.txHash) {
            if (p.txHash !== input.txHash)
              throw new ApiError(409, "Payment already submitted");
            return { ok: true, status: p.status };
          }
          requirePayable(p.invoice);
          const count = await tx.invoice.updateMany({
            where: {
              id: p.invoiceId,
              status: "PENDING",
              expiresAt: { gt: new Date() },
            },
            data: { status: "PAYMENT_SUBMITTED" },
          });
          if (count.count !== 1)
            throw new ApiError(409, "Invoice already has a submitted payment");
          await tx.paymentAttempt.update({
            where: { id },
            data: { txHash: input.txHash, status: "SUBMITTED" },
          });
          return { ok: true, status: "SUBMITTED" };
        },
        { isolationLevel: "Serializable" },
      );
      return json(result);
    }
    if (
      path[0] === "payments" &&
      path[2] === "reconcile" &&
      path.length === 3 &&
      method === "POST"
    ) {
      const merchant = await requireMerchant();
      return json(
        await reconcileMock(
          v.uuid.parse(path[1]),
          await body(req, v.reconcileInput),
          merchant.id,
        ),
      );
    }
    if (path[0] === "payments" && path.length === 2 && method === "GET") {
      const id = v.uuid.parse(path[1]);
      const p = await db.paymentAttempt.findUnique({
        where: { id },
        include: { invoice: true },
      });
      const capability = new URL(req.url).searchParams.get("capability");
      if (!p || !capability || !equalHash(p.capabilityHash, hash(capability)))
        throw new ApiError(404, "Payment not found");
      return json({
        id: p.id,
        status: p.status,
        txHash: p.txHash,
        failureCode: p.failureCode,
        invoiceStatus: p.invoice.status,
      });
    }
    if (key === "mock/scan" && method === "POST") {
      await body(req, z.object({}).strict());
      if (process.env.PRIVACY_PROVIDER !== "mock")
        throw new ApiError(404, "Not found");
      const merchant = await requireMerchant();
      await db.$transaction(async (tx) => {
        const attempts = await tx.paymentAttempt.findMany({
          where: {
            invoice: { merchantId: merchant.id, status: "PAYMENT_SUBMITTED" },
            status: "SUBMITTED",
          },
        });
        for (const p of attempts) {
          await tx.paymentAttempt.updateMany({
            where: { id: p.id, status: "SUBMITTED" },
            data: { status: "CHAIN_CONFIRMED", confirmedAt: new Date() },
          });
          await tx.invoice.updateMany({
            where: { id: p.invoiceId, status: "PAYMENT_SUBMITTED" },
            data: { status: "CONFIRMING" },
          });
        }
      });
      const payments = await db.paymentAttempt.findMany({
        where: {
          invoice: { merchantId: merchant.id },
          status: { in: ["CHAIN_CONFIRMED", "PRIVATE_NOTE_DETECTED"] },
        },
        select: {
          id: true,
          invoiceId: true,
          providerReference: true,
          txHash: true,
          tokenAddress: true,
          amountAtomic: true,
          status: true,
        },
      });
      return json({ payments, provider: "mock" });
    }
    if (key === "mock/balances" && method === "GET") {
      if (process.env.PRIVACY_PROVIDER !== "mock")
        throw new ApiError(404, "Not found");
      const merchant = await requireMerchant();
      return json(await db.$transaction((tx) => mockBalances(tx, merchant.id)));
    }
    if (key === "mock/spendability" && method === "POST") {
      await body(req, z.object({}).strict());
      if (process.env.PRIVACY_PROVIDER !== "mock")
        throw new ApiError(404, "Not found");
      const merchant = await requireMerchant();
      await db.paymentAttempt.updateMany({
        where: {
          invoice: { merchantId: merchant.id, status: "PAID" },
          status: "PRIVATE_NOTE_DETECTED",
          balanceState: "pending",
        },
        data: { balanceState: "spendable" },
      });
      return json({ ok: true, provider: "mock" });
    }
    if (key === "mock/withdraw" && method === "POST") {
      if (process.env.PRIVACY_PROVIDER !== "mock")
        throw new ApiError(404, "Not found");
      const merchant = await requireMerchant();
      const input = await body(req, v.withdrawalInput);
      const token = TOKENS[input.tokenSymbol];
      const amount = parseUnits(input.amount, token.decimals);
      if (amount <= 0n)
        throw new ApiError(400, "Amount must be greater than zero");
      return json(
        await db.$transaction(
          async (tx) => {
            await tx.merchant.update({
              where: { id: merchant.id },
              data: { updatedAt: new Date() },
            });
            const balance = (await mockBalances(tx, merchant.id)).find(
              (b) => b.tokenSymbol === input.tokenSymbol,
            );
            if (!balance || BigInt(balance.spendable) < amount)
              throw new ApiError(409, "Insufficient spendable private balance");
            return tx.mockWithdrawal.create({
              data: {
                merchantId: merchant.id,
                tokenAddress: token.address.toLowerCase(),
                amountAtomic: amount.toString(),
                destination: input.destination,
                txHash: "0x" + randomToken(),
              },
            });
          },
          { isolationLevel: "Serializable" },
        ),
      );
    }
    if (path[0] === "receipts" && path.length === 2 && method === "GET") {
      const id = v.uuid.parse(path[1]);
      const receipt = await db.receipt.findUnique({
        where: { id },
        select: {
          id: true,
          receiptNumber: true,
          issuedAt: true,
          payload: true,
          payloadHash: true,
          signature: true,
          publicKey: true,
          signatureAlgorithm: true,
          invoice: {
            select: {
              invoiceNumber: true,
              description: true,
              tokenSymbol: true,
              decimals: true,
            },
          },
        },
      });
      if (!receipt) throw new ApiError(404, "Receipt not found");
      return json(receipt);
    }
    throw new ApiError(404, "Not found");
  } catch (error) {
    if (error instanceof ApiError)
      return json({ error: error.message }, error.status);
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return json({ error: "Invalid request" }, 400);
    return json(
      { error: "Request could not be completed. Please retry." },
      500,
    );
  }
}
