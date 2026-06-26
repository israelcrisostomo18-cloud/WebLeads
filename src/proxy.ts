import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE_NAME, verifyAccessCookieValue } from "@/lib/auth/access";

const PROTECTED_APP_PREFIXES = ["/prospeccao-manual", "/criar-site", "/site-builder", "/app", "/dashboard"];
const PROTECTED_API_PREFIXES = [
  "/api/leads/search/private",
  "/api/generate-landing",
  "/api/generate-site-html",
  "/api/generated-sites",
  "/api/lead-status",
];

function isProtectedPath(pathname: string) {
  return (
    PROTECTED_APP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
    PROTECTED_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  );
}

function isApiPath(pathname: string) {
  return pathname.startsWith("/api/");
}

async function hasActiveSubscription(email: string) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return false;
  }

  const url = new URL("/rest/v1/subscriptions", supabaseUrl);
  url.searchParams.set("select", "id,email,status,expires_at");
  url.searchParams.set("email", `eq.${email}`);
  url.searchParams.set("status", "eq.active");
  url.searchParams.set("expires_at", `gt.${new Date().toISOString()}`);
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return false;
  }

  const subscriptions = (await response.json().catch(() => [])) as unknown[];
  return subscriptions.length > 0;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (process.env.WEBLEADS_PAYWALL_ENABLED === "false" || !isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const session = await verifyAccessCookieValue(request.cookies.get(ACCESS_COOKIE_NAME)?.value);
  const active = session ? await hasActiveSubscription(session.email) : false;

  if (active) {
    return NextResponse.next();
  }

  if (isApiPath(pathname)) {
    return NextResponse.json(
      { error: "Assinatura ativa necessaria para acessar a ferramenta." },
      { status: 401 },
    );
  }

  const redirectUrl = new URL("/", request.url);
  redirectUrl.hash = "planos";
  redirectUrl.searchParams.set("bloqueado", "assinatura");
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    "/prospeccao-manual/:path*",
    "/criar-site/:path*",
    "/site-builder/:path*",
    "/app/:path*",
    "/dashboard/:path*",
    "/api/leads/search/private",
    "/api/generate-landing",
    "/api/generate-site-html",
    "/api/generated-sites/:path*",
    "/api/lead-status",
  ],
};
