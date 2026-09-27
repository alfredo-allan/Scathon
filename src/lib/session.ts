import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { UserRole } from "@/types";

/**
 * Server-only session: a signed, httpOnly cookie that `src/proxy.ts` checks
 * before a request is even allowed to reach `/admin`. This is the "real"
 * gate the security note in `<AdminView/>` used to ask for - unlike the
 * `scathon:session` value in `localStorage` (still used for everything
 * else, see `@/context/AuthContext`), this cookie is signed with a secret
 * only the server knows, so nothing in devtools/localStorage can forge one.
 *
 * The signature only proves "the server issued this and it hasn't been
 * tampered with" - it says nothing about whether the *data* behind `/admin`
 * is itself protected. It still isn't, fully: the admin tabs are client
 * components reading plain mock arrays (`@/lib/adminOrders`,
 * `@/lib/adminCustomers`, ...), which ship inside the route's JS bundle
 * like every other client component in this app. Proxy stops an
 * unauthorized visitor from ever loading that route/bundle through normal
 * navigation, but it doesn't turn the mock data itself into a
 * server-only secret - that needs a real backend (the data fetched from a
 * protected API/DB instead of imported as a static module), same as the
 * rest of this project's "mock now, swap later" data layer.
 */

const SESSION_COOKIE_NAME = "scathon_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12h

let cachedSecretKey: Uint8Array | null = null;

/**
 * Resolves the signing secret. In production this must come from the
 * `SESSION_SECRET` environment variable (set it in the Vercel project's
 * settings - see `.env.example`); a missing secret there throws loudly
 * instead of silently issuing forgeable sessions. In development a fixed
 * fallback is used so `pnpm dev`/`pnpm build` work out of the box with no
 * setup - never reused in production.
 */
function getSecretKey(): Uint8Array {
  if (cachedSecretKey) return cachedSecretKey;

  const configured = process.env.SESSION_SECRET;
  if (configured && configured.trim().length > 0) {
    cachedSecretKey = new TextEncoder().encode(configured);
    return cachedSecretKey;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET não está configurada. Defina essa variável de ambiente " +
        "(Vercel: Project Settings -> Environment Variables) antes de aceitar " +
        "logins em produção - sem ela não há como emitir/verificar a sessão " +
        "assinada que protege /admin.",
    );
  }

  // Development-only fallback so a fresh checkout runs immediately.
  cachedSecretKey = new TextEncoder().encode(
    "dev-only-insecure-secret-do-not-use-in-production-scathon",
  );
  return cachedSecretKey;
}

export interface SessionPayload extends JWTPayload {
  email: string;
  role: UserRole;
  displayName: string;
}

/** Signs a session token for a known (server-verified) account. */
export async function createSessionToken(payload: {
  email: string;
  role: UserRole;
  displayName: string;
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

/** Verifies a session token, returning its payload or `null` if invalid/expired. */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.email === "string" &&
      typeof payload.displayName === "string" &&
      (payload.role === "admin" || payload.role === "customer")
    ) {
      return payload as SessionPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = {
  name: SESSION_COOKIE_NAME,
  maxAge: SESSION_TTL_SECONDS,
} as const;
