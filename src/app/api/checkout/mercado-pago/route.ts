import { NextResponse } from "next/server";
import { createPendingCheckout, normalizeBillingEmail } from "@/lib/billing/subscriptions";
import { getBillingPlan } from "@/lib/billing/plans";

const MERCADO_PAGO_PREFERENCES_URL = "https://api.mercadopago.com/checkout/preferences";

async function readCheckoutBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return ((await request.json().catch(() => null)) ?? {}) as { email?: string; planId?: string };
  }

  const formData = await request.formData();
  return {
    email: String(formData.get("email") ?? ""),
    planId: String(formData.get("planId") ?? ""),
  };
}

function redirectWithError(request: Request, message: string) {
  const url = new URL("/#planos", request.url);
  url.searchParams.set("erro", message);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    return redirectWithError(request, "Checkout ainda nao configurado.");
  }

  const body = await readCheckoutBody(request);
  const email = normalizeBillingEmail(body.email ?? "");
  const plan = getBillingPlan(body.planId);

  if (!email || !plan) {
    return redirectWithError(request, "Informe email e plano.");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const preferencePayload = {
    items: [
      {
        id: plan.id,
        title: `WebLeads - ${plan.name}`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: plan.amountCents / 100,
      },
    ],
    payer: {
      email,
    },
    metadata: {
      email,
      plan_id: plan.id,
    },
    external_reference: `${email}:${plan.id}:${Date.now()}`,
    notification_url: `${appUrl}/api/webhooks/mercado-pago`,
    back_urls: {
      success: `${appUrl}/acesso?status=success&email=${encodeURIComponent(email)}`,
      pending: `${appUrl}/acesso?status=pending&email=${encodeURIComponent(email)}`,
      failure: `${appUrl}/acesso?status=failure&email=${encodeURIComponent(email)}`,
    },
    auto_return: "approved",
  };

  const response = await fetch(MERCADO_PAGO_PREFERENCES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preferencePayload),
  });

  const payload = (await response.json().catch(() => null)) as {
    id?: string;
    init_point?: string;
    sandbox_init_point?: string;
    message?: string;
  } | null;

  if (!response.ok || !payload?.id || !payload.init_point) {
    return redirectWithError(request, payload?.message ?? "Nao foi possivel abrir o checkout.");
  }

  await createPendingCheckout({
    email,
    planId: plan.id,
    checkoutCustomerId: payload.id,
  });

  return NextResponse.redirect(payload.init_point, 303);
}
