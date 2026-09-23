import type { UserRole } from "@/types";
import { createPersistedStore } from "./createPersistedStore";

export interface MockAccount {
  email: string;
  /**
   * Stored in plain text purely because this whole app has no backend to
   * hash/verify it server-side - a real signup would never persist a
   * password client-side at all, let alone unhashed. This exists only so
   * `/login` has something concrete to check "did you type the right
   * password" against while testing the flow end to end.
   */
  password: string;
  displayName: string;
  phone: string;
  /** Data URL from `@/lib/imageFile`'s `readImageAsDataUrl`, a real asset path, or null for the initials fallback. */
  avatarUrl: string | null;
  /**
   * Required (not optional) so every account in the table - seeded or
   * signed-up - always carries an explicit role instead of leaving it to
   * an implicit default. `registerAccount` (the public "Criar Conta" path)
   * always forces this to `"customer"` regardless of what's passed in -
   * self-signup can never mint an admin. The only `"admin"` account is the
   * one seeded below.
   */
  role: UserRole;
}

/**
 * The one pre-seeded customer login the whole team can test with -
 * cliente@scathon.com / senha123 - matching `@/context/AuthContext`'s
 * `MOCK_CUSTOMER` identity (that file imports this seed's fields rather
 * than the other way around, so the display name/photo/phone shown
 * throughout the app before any real login - header avatar, `/account` -
 * and the one `/login` actually authenticates against never drift apart).
 */
export const SEED_ACCOUNT: MockAccount = {
  email: "cliente@scathon.com",
  password: "senha123",
  displayName: "Cliente Scathon",
  phone: "(11) 91234-5678",
  avatarUrl: "/avatar.jpg",
  role: "customer",
};

/**
 * The one pre-seeded admin login - admin@scathon.com / senha123 - so
 * `/admin` (see `<AdminView/>`) has something real to sign in as while
 * testing the flow, same spirit as `SEED_ACCOUNT` above. No avatar photo on
 * purpose (falls back to the initials circle) - this is an internal/staff
 * account, not a storefront customer profile.
 */
export const ADMIN_SEED_ACCOUNT: MockAccount = {
  email: "admin@scathon.com",
  password: "senha123",
  displayName: "Admin Scathon",
  phone: "(11) 90000-0000",
  avatarUrl: null,
  role: "admin",
};

/**
 * Mock "accounts table", keyed by lowercased e-mail. No backend yet, so
 * this - like `cartStore`/`wishlistStore` - only lives in `localStorage`;
 * `/login`'s "Criar Conta" tab adds an entry here via `registerAccount`,
 * and "Entrar" checks against it via `findAccount`.
 */
export const accountsStore = createPersistedStore<Record<string, MockAccount>>("scathon:accounts", {
  [SEED_ACCOUNT.email]: SEED_ACCOUNT,
  [ADMIN_SEED_ACCOUNT.email]: ADMIN_SEED_ACCOUNT,
});

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function findAccount(email: string): MockAccount | null {
  return accountsStore.getSnapshot()[normalizeEmail(email)] ?? null;
}

/**
 * Creates or overwrites a mock account. `async`/`Promise`-returning for the
 * same reason as `@/lib/waitlist`'s `notifyInterest` - the future version
 * is a real `POST /api/signup` and `<LoginView/>`, the only caller, doesn't
 * need to change.
 *
 * Always forces `role: "customer"` - the public signup form has no field
 * for it and never should; the only way an account becomes `"admin"` is by
 * being seeded here in code, which is exactly the "proteção total" this
 * needs until there's a real backend to enforce it server-side instead
 * (see `<AdminView/>`'s doc comment for the rest of that security note).
 */
export async function registerAccount(account: MockAccount): Promise<MockAccount> {
  const email = normalizeEmail(account.email);
  const entry: MockAccount = { ...account, email, role: "customer" };
  accountsStore.setValue((prev) => ({ ...prev, [email]: entry }));
  return entry;
}
