import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME } from "@/lib/auth/access";

export async function POST() {
  const response = NextResponse.json({ ok: true, redirectTo: "/" });
  response.cookies.delete(ACCESS_COOKIE_NAME);
  return response;
}
