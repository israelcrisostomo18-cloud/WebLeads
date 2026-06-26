export const ACCESS_COOKIE_NAME = "wl_access";

export type AccessSession = {
  email: string;
  expiresAt: string;
};

function base64UrlEncode(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function signatureToBase64Url(signature: ArrayBuffer) {
  const bytes = new Uint8Array(signature);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function getAccessSecret() {
  return (
    process.env.WEBLEADS_ACCESS_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "webleads-local-development-secret"
  );
}

async function signPayload(payload: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getAccessSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return signatureToBase64Url(signature);
}

function safeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function createAccessCookieValue(email: string, expiresAt: string) {
  const session: AccessSession = {
    email: safeEmail(email),
    expiresAt,
  };
  const payload = base64UrlEncode(JSON.stringify(session));
  const signature = await signPayload(payload);
  return `${payload}.${signature}`;
}

export async function verifyAccessCookieValue(cookieValue: string | undefined | null): Promise<AccessSession | null> {
  if (!cookieValue || !cookieValue.includes(".")) {
    return null;
  }

  const [payload, signature] = cookieValue.split(".");
  const expectedSignature = await signPayload(payload);

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const session = JSON.parse(base64UrlDecode(payload)) as AccessSession;
    const email = safeEmail(session.email ?? "");

    if (!email || !Number.isFinite(Date.parse(session.expiresAt)) || new Date(session.expiresAt) <= new Date()) {
      return null;
    }

    return { email, expiresAt: session.expiresAt };
  } catch {
    return null;
  }
}
