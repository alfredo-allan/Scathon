import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:5000/api/v1";

interface BackendMeResponse {
  user?: {
    email?: unknown;
    role?: unknown;
    displayName?: unknown;
  };
}

/**
 * Issues the real, signed session cookie that `src/proxy.ts` checks before
 * letting anyone into `/admin`. Called by `<LoginView/>` right after a real
 * sign-in against the Flask backend (`POST /api/v1/auth/login`, see
 * `@/lib/auth`'s `loginRequest`) already succeeded - with the JWT that call
 * returned, not with the e-mail/senha themselves (those never need to leave
 * the browser a second time).
 *
 * This route re-verifies that JWT itself, server-to-server, against the
 * backend's own `GET /api/v1/auth/me` - never trusting a `role`/`email` the
 * client could send directly. A visitor can freely edit their own
 * `localStorage` to *claim* `role: "admin"` for the client-side session used
 * for UI (see `<AuthContext/>`), but that edit never reaches this route or
 * changes what it's willing to sign - only a token the Flask backend itself
 * decoded and recognized as belonging to an admin account gets an
 * admin-role cookie back. This is what makes the `/admin` gate real instead
 * of cosmetic - same spirit as before this route existed, just no longer
 * re-checking a mock accounts table (`@/lib/accounts`, now deleted) that
 * only ever knew about the two seeded logins.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_body" }, { status: 400 });
  }

  const { token } = (body ?? {}) as { token?: unknown };
  if (typeof token !== "string" || token.length === 0) {
    return NextResponse.json({ ok: false, reason: "invalid_body" }, { status: 400 });
  }

  let backendUser: BackendMeResponse["user"] | null = null;
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const data = (await response.json()) as BackendMeResponse;
      backendUser = data.user ?? null;
    }
  } catch {
    // Backend fora do ar - mesmo tratamento do token inválido logo abaixo:
    // sem sessão de servidor, o visitante só fica sem acesso a /admin (a
    // sessão real pra UI, essa já existe desde o `loginRequest` original).
  }

  if (
    !backendUser ||
    typeof backendUser.email !== "string" ||
    typeof backendUser.displayName !== "string" ||
    (backendUser.role !== "admin" && backendUser.role !== "customer")
  ) {
    // Not a failure worth surfacing to the visitor: `<LoginView/>` already
    // has a real, backend-confirmed session for the UI at this point (see
    // `loginRequest`) - this route only decides whether that session ALSO
    // gets the separate `/admin`-gate cookie, which a `role: "customer"`
    // account never needed anyway.
    return NextResponse.json({ ok: false, reason: "token_not_verified" });
  }

  const role = backendUser.role;
  const sessionToken = await createSessionToken({
    email: backendUser.email,
    role,
    displayName: backendUser.displayName,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE.name, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE.maxAge,
  });

  return NextResponse.json({ ok: true, role });
}
