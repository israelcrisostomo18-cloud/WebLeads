import { NextResponse } from "next/server";
import { getDemoUserId, getSupabaseAdmin } from "@/lib/supabase";
import type { LeadStatus } from "@/types";

const VALID_STATUSES: LeadStatus[] = [
  "novo",
  "prospectado",
  "interessado",
  "vendido",
  "recusado",
];

export async function POST(request: Request) {
  const body = (await request.json()) as {
    businessId?: string;
    status?: LeadStatus;
    notes?: string;
  };

  if (!body.businessId || !body.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Status ou lead inválido." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase não configurado." },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("lead_status")
    .upsert(
      {
        business_id: body.businessId,
        user_id: getDemoUserId(),
        status: body.status,
        notes: body.notes ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "business_id,user_id" },
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: data });
}
