import { cookies } from "next/headers";
import { ACCESS_COOKIE_NAME, verifyAccessCookieValue } from "@/lib/auth/access";
import { getActiveSubscriptionByEmail } from "@/lib/billing/subscriptions";

export type UserAccessStatus = "visitor" | "aguardando_pagamento" | "ativo" | "vencido" | "cancelado";

export type CurrentAccessUser = {
  email: string | null;
  status: UserAccessStatus;
};

export function canViewLeadDetails(user: CurrentAccessUser | null | undefined) {
  return user?.status === "ativo";
}

export function canCreateLandingPage(user: CurrentAccessUser | null | undefined) {
  return user?.status === "ativo";
}

export async function getCurrentAccessUser(): Promise<CurrentAccessUser> {
  const cookieStore = await cookies();
  const session = await verifyAccessCookieValue(cookieStore.get(ACCESS_COOKIE_NAME)?.value);

  if (!session) {
    return { email: null, status: "visitor" };
  }

  const subscription = await getActiveSubscriptionByEmail(session.email);

  if (subscription) {
    return { email: session.email, status: "ativo" };
  }

  return { email: session.email, status: "vencido" };
}
