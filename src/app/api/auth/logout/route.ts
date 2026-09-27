import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * Clears the signed session cookie set by `POST /api/auth/login`. Called
 * from `<AuthContext/>`'s `logout()` alongside clearing the client-side
 * `scathon:session` value in `localStorage`, so both the UI session and the
 * real `/admin` gate end together.
 */
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE.name);
  return NextResponse.json({ ok: true });
}
