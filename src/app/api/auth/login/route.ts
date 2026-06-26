import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, createAccessCookieValue } from "@/lib/auth/access";
import { getActiveSubscriptionByEmail, normalizeBillingEmail } from "@/lib/billing/subscriptions";

async function readEmail(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as { email?: string } | null;
    return body?.email ?? "";
  }

  const formData = await request.formData();
  return String(formData.get("email") ?? "");
}

export async function POST(request: Request) {
  const email = normalizeBillingEmail(await readEmail(request));

  if (!email) {
    return NextResponse.json({ error: "Informe o email usado na compra." }, { status: 400 });
  }

  const subscription = await getActiveSubscriptionByEmail(email);

  if (!subscription?.expires_at) {
    return NextResponse.json(
      { error: "Nenhuma assinatura ativa foi encontrada para esse email." },
      { status: 403 },
    );
  }

  const cookieValue = await createAccessCookieValue(email, subscription.expires_at);
  const response = NextResponse.json({ ok: true, redirectTo: "/mapa" });

  response.cookies.set(ACCESS_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(subscription.expires_at),
  });

  return response;
}
