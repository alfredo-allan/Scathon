import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session";

/**
 * Real, server-side gate for `/admin` - this is what makes the "nunca
 * permitir que um usuário comum consiga visualizar o que um administrador
 * faz" requirement actually true, instead of just a client-side redirect a
 * visitor could skip by disabling JS or editing `localStorage`.
 *
 * This file (not `middleware.ts`) is the Next 16 convention - `middleware`
 * was renamed to `proxy` in this version; see
 * `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.
 * It runs on the server (Node.js runtime by default here) before any
 * `/admin` route renders, for both hard loads and client-side `<Link>`
 * navigations alike.
 *
 * It only checks the signed `scathon_session` cookie set by
 * `POST /api/auth/login` (see `@/lib/session`) - never the `scathon:session`
 * value `<AuthContext/>` keeps in `localStorage` for the rest of the app's
 * UI, since that one is plain client-readable/writable state and proves
 * nothing on its own.
 */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE.name)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session || session.role !== "admin") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
