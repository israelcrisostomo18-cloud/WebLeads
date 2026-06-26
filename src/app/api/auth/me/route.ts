import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, verifyAccessCookieValue } from "@/lib/auth/access";
import { getActiveSubscriptionByEmail } from "@/lib/billing/subscriptions";

export async function GET() {
  const cookieStore = await cookies();
  const session = await verifyAccessCookieValue(cookieStore.get(ACCESS_COOKIE_NAME)?.value);

  if (!session) {
    return NextResponse.json({ authenticated: false, active: false });
  }

  const subscription = await getActiveSubscriptionByEmail(session.email);

  return NextResponse.json({
    authenticated: true,
    active: Boolean(subscription),
    email: session.email,
    subscription,
  });
}
