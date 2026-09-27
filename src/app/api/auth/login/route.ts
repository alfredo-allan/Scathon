import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { findAccount } from "@/lib/accounts";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

/**
 * Issues the real, signed session cookie that `src/proxy.ts` checks before
 * letting anyone into `/admin`. Called by `<LoginView/>` right after its own
 * client-side check against `@/lib/accounts`'s mock table already succeeded
 * - this route independently re-checks the same e-mail/senha, but against
 * the server's own view of that table.
 *
 * That's the key difference from the client-side check: `findAccount` here
 * runs on the server, where `@/lib/createPersistedStore` has no
 * `localStorage` to read from, so it only ever resolves the two accounts
 * seeded in code (`SEED_ACCOUNT`, `ADMIN_SEED_ACCOUNT`) - never an account
 * someone signed up for through "Criar Conta" (that one only ever lived in
 * the visitor's own browser). A visitor can freely edit their own
 * `localStorage` to *claim* `role: "admin"` for the client-side session used
 * for UI (see `<AuthContext/>`), but that edit never reaches this route or
 * changes what it's willing to sign - only a request that actually knows
 * admin@scathon.com's real password gets an admin-role cookie back. This is
 * what makes the `/admin` gate real instead of cosmetic.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_body" }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as { email?: unknown; password?: unknown };
  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ ok: false, reason: "invalid_body" }, { status: 400 });
  }

  const account = findAccount(email);
  if (!account || account.password !== password) {
    // Not a failure worth surfacing to the visitor: most logins are
    // self-registered accounts the server has never heard of (see doc
    // comment above). `<LoginView/>` already validated those against its
    // own client-side table before ever calling this route, so this just
    // means "no real server session for this login" - the client-only
    // session still carries the visitor through the rest of the app, just
    // never past the `/admin` gate (which is exactly right: a self-signed-up
    // account is always `role: "customer"` and has no business there).
    return NextResponse.json({ ok: false, reason: "no_server_account" });
  }

  const token = await createSessionToken({
    email: account.email,
    role: account.role,
    displayName: account.displayName,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE.name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE.maxAge,
  });

  return NextResponse.json({ ok: true, role: account.role });
}
