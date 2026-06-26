import { getSupabaseAdmin } from "@/lib/supabase";
import { addPlanMonths, getBillingPlan } from "@/lib/billing/plans";

export type SubscriptionStatus = "active" | "pending" | "expired" | "canceled" | "refunded";

export type SubscriptionRecord = {
  id: string;
  user_id: string | null;
  email: string;
  name: string | null;
  plan_id: string;
  status: SubscriptionStatus;
  starts_at: string | null;
  expires_at: string | null;
  payment_id: string | null;
  checkout_customer_id: string | null;
  updated_at: string;
};

export function normalizeBillingEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function ensureBillingUser(email: string, name?: string | null) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return null;
  }

  const normalizedEmail = normalizeBillingEmail(email);
  const { data: existing } = await supabase
    .from("users")
    .select("id,email,name")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const { data } = await supabase
    .from("users")
    .insert({ email: normalizedEmail, name: name ?? null })
    .select("id,email,name")
    .single();

  return data ?? null;
}

export async function getActiveSubscriptionByEmail(email: string): Promise<SubscriptionRecord | null> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("email", normalizeBillingEmail(email))
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as SubscriptionRecord | null) ?? null;
}

export async function createPendingCheckout(args: {
  email: string;
  planId: string;
  paymentId?: string | null;
  checkoutCustomerId?: string | null;
}) {
  const supabase = getSupabaseAdmin();
  const plan = getBillingPlan(args.planId);

  if (!supabase || !plan) {
    return null;
  }

  const user = await ensureBillingUser(args.email);
  const normalizedEmail = normalizeBillingEmail(args.email);
  const row = {
      user_id: user?.id ?? null,
      email: normalizedEmail,
      plan_id: plan.id,
      status: "pending",
      payment_id: args.paymentId ?? null,
      checkout_customer_id: args.checkoutCustomerId ?? null,
      starts_at: null,
      expires_at: null,
      updated_at: new Date().toISOString(),
    };
  const query = args.paymentId
    ? supabase.from("subscriptions").upsert(row, { onConflict: "payment_id" })
    : supabase.from("subscriptions").insert(row);
  const { data } = await query.select("*").single();

  return data as SubscriptionRecord | null;
}

export async function recordPayment(args: {
  email: string;
  planId: string;
  paymentId: string;
  checkoutCustomerId?: string | null;
  status: string;
  amountCents: number;
  rawPayload: unknown;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return null;
  }

  const user = await ensureBillingUser(args.email);
  const { data } = await supabase
    .from("payments")
    .upsert(
      {
        user_id: user?.id ?? null,
        email: normalizeBillingEmail(args.email),
        plan_id: args.planId,
        payment_id: args.paymentId,
        checkout_customer_id: args.checkoutCustomerId ?? null,
        status: args.status,
        amount_cents: args.amountCents,
        raw_payload: args.rawPayload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "payment_id" },
    )
    .select("*")
    .single();

  return data ?? null;
}

export async function activateSubscriptionFromPayment(args: {
  email: string;
  planId: string;
  paymentId: string;
  checkoutCustomerId?: string | null;
}) {
  const supabase = getSupabaseAdmin();
  const plan = getBillingPlan(args.planId);

  if (!supabase || !plan) {
    return null;
  }

  const user = await ensureBillingUser(args.email);
  const startsAt = new Date();
  const expiresAt = addPlanMonths(startsAt, plan);
  const { data } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: user?.id ?? null,
        email: normalizeBillingEmail(args.email),
        plan_id: plan.id,
        status: "active",
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        payment_id: args.paymentId,
        checkout_customer_id: args.checkoutCustomerId ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "payment_id" },
    )
    .select("*")
    .single();

  return data as SubscriptionRecord | null;
}

export async function blockSubscriptionFromPayment(args: {
  email: string;
  paymentId: string;
  status: "canceled" | "refunded" | "expired";
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("subscriptions")
    .update({
      status: args.status,
      updated_at: new Date().toISOString(),
    })
    .eq("email", normalizeBillingEmail(args.email))
    .eq("payment_id", args.paymentId)
    .select("*")
    .maybeSingle();

  return data as SubscriptionRecord | null;
}
