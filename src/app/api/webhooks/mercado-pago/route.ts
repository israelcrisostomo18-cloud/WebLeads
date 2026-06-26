import { NextResponse } from "next/server";
import { getBillingPlan } from "@/lib/billing/plans";
import {
  activateSubscriptionFromPayment,
  blockSubscriptionFromPayment,
  createPendingCheckout,
  normalizeBillingEmail,
  recordPayment,
} from "@/lib/billing/subscriptions";

type MercadoPagoPayment = {
  id?: number | string;
  status?: string;
  status_detail?: string;
  transaction_amount?: number;
  payer?: { email?: string; id?: string | number };
  metadata?: {
    email?: string;
    plan_id?: string;
    planId?: string;
  };
  external_reference?: string;
};

function parseExternalReference(reference: string | undefined | null) {
  if (!reference) {
    return { email: "", planId: "" };
  }

  const [email, planId] = reference.split(":");
  return { email: email ?? "", planId: planId ?? "" };
}

function getWebhookPaymentId(request: Request, body: unknown) {
  const url = new URL(request.url);
  const bodyRecord = body as { data?: { id?: string | number }; resource?: string; id?: string | number } | null;
  const resource = bodyRecord?.resource ?? "";

  if (bodyRecord?.data?.id) {
    return String(bodyRecord.data.id);
  }

  if (bodyRecord?.id) {
    return String(bodyRecord.id);
  }

  if (resource.includes("/")) {
    return resource.split("/").pop() ?? "";
  }

  return url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "";
}

async function verifyWebhookSignature(request: Request, paymentId: string) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

  if (!secret) {
    return true;
  }

  const signatureHeader = request.headers.get("x-signature") ?? "";
  const requestId = request.headers.get("x-request-id") ?? "";
  const ts = signatureHeader.match(/ts=([^,]+)/)?.[1] ?? "";
  const v1 = signatureHeader.match(/v1=([^,]+)/)?.[1] ?? "";

  if (!requestId || !ts || !v1 || !paymentId) {
    return false;
  }

  const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(manifest));
  const hex = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return hex === v1;
}

async function fetchPayment(paymentId: string): Promise<MercadoPagoPayment | null> {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    return null;
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json().catch(() => null)) as MercadoPagoPayment | null;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as unknown;
  const paymentId = getWebhookPaymentId(request, body);

  if (!paymentId) {
    return NextResponse.json({ ok: false, error: "Pagamento nao informado." }, { status: 400 });
  }

  const validSignature = await verifyWebhookSignature(request, paymentId);

  if (!validSignature) {
    return NextResponse.json({ ok: false, error: "Assinatura invalida." }, { status: 401 });
  }

  const payment = await fetchPayment(paymentId);

  if (!payment) {
    return NextResponse.json({ ok: false, error: "Pagamento nao encontrado." }, { status: 404 });
  }

  const fromReference = parseExternalReference(payment.external_reference);
  const email = normalizeBillingEmail(payment.metadata?.email ?? payment.payer?.email ?? fromReference.email);
  const planId = payment.metadata?.plan_id ?? payment.metadata?.planId ?? fromReference.planId;
  const plan = getBillingPlan(planId);
  const status = payment.status ?? "unknown";

  if (!email || !plan) {
    return NextResponse.json({ ok: false, error: "Email ou plano ausente no pagamento." }, { status: 400 });
  }

  await recordPayment({
    email,
    planId: plan.id,
    paymentId: String(payment.id ?? paymentId),
    checkoutCustomerId: payment.payer?.id ? String(payment.payer.id) : null,
    status,
    amountCents: Math.round(Number(payment.transaction_amount ?? 0) * 100),
    rawPayload: payment,
  });

  if (status === "approved") {
    await activateSubscriptionFromPayment({
      email,
      planId: plan.id,
      paymentId: String(payment.id ?? paymentId),
      checkoutCustomerId: payment.payer?.id ? String(payment.payer.id) : null,
    });
  } else if (status === "refunded" || status === "charged_back") {
    await blockSubscriptionFromPayment({
      email,
      paymentId: String(payment.id ?? paymentId),
      status: "refunded",
    });
  } else if (status === "cancelled" || status === "canceled" || status === "rejected") {
    await blockSubscriptionFromPayment({
      email,
      paymentId: String(payment.id ?? paymentId),
      status: "canceled",
    });
  } else {
    await createPendingCheckout({
      email,
      planId: plan.id,
      paymentId: String(payment.id ?? paymentId),
      checkoutCustomerId: payment.payer?.id ? String(payment.payer.id) : null,
    });
  }

  return NextResponse.json({ ok: true });
}
