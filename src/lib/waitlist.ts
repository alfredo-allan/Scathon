import { apiFetch, ApiError } from "./apiClient";
import { createPersistedStore } from "./createPersistedStore";

export interface WaitlistEntry {
  productId: string;
  email: string;
  /** The apparel size the visitor had selected, if any, when they signed up. */
  size?: string;
  createdAt: string;
}

/**
 * Same persisted-external-store shape as `CartContext`/`WishlistContext`
 * (see `createPersistedStore`'s doc comment) - `<NotifyMeButton/>` reads
 * this via `useSyncExternalStore` directly rather than a `useEffect`, which
 * is what keeps "has this visitor already joined this product's waitlist"
 * both hydration-safe and free of the `react-hooks/set-state-in-effect`
 * lint rule.
 *
 * This is now a CACHE, not the source of truth - see `notifyInterest`'s doc
 * comment. It exists so a card doesn't have to hit the network again every
 * time it remounts just to know "did I already tell the backend about
 * this?", and so the interaction still feels instant on a flaky connection
 * (the backend call still has to succeed for the entry to count for real -
 * see below - but once it does, this is what makes the "done" state survive
 * a reload without asking the network again).
 */
export const waitlistStore = createPersistedStore<WaitlistEntry[]>("scathon:waitlist", []);

interface JoinWaitlistResponse {
  entry: { productId: string; email: string; size: string | null; createdAt: string };
  alreadyRegistered: boolean;
}

/**
 * Records interest in a `coming_soon` product (see `Product.availability`)
 * by calling the real backend (`POST /api/v1/waitlist` in `scathon-api` -
 * ver `app/catalog/__init__.py`), seção 6 do briefing.
 *
 * `token`/`accountEmail` come from `<AuthContext/>`: when there's a session,
 * `<NotifyMeButton/>` passes the account's own e-mail instead of asking the
 * visitor to type one again. The backend is what actually enforces this
 * (it always uses the *authenticated* account's e-mail, verified from the
 * real JWT in `token`, and ignores whatever the request body says) -
 * `email` here just saves the backend a lookup and keeps this call working
 * the same way whether or not a session happens to be present.
 *
 * Errors (invalid e-mail, rate-limited, product no longer `coming_soon`,
 * etc.) are re-thrown as `ApiError` for the caller to show a real message
 * instead of silently pretending it worked.
 */
export async function notifyInterest(
  productId: string,
  email: string,
  size?: string,
  token?: string | null,
): Promise<void> {
  const current = waitlistStore.getSnapshot();
  if (current.some((entry) => entry.productId === productId && entry.email === email)) return;

  await apiFetch<JoinWaitlistResponse>("/waitlist", {
    method: "POST",
    token,
    body: { productId, email, size },
  });

  // Só chega aqui se o backend confirmou (`apiFetch` lança `ApiError` em
  // qualquer resposta que não seja 2xx) - o cache local só espelha um
  // sucesso real, nunca "torce" pra dar certo.
  waitlistStore.setValue([...current, { productId, email, size, createdAt: new Date().toISOString() }]);
}

export { ApiError };
