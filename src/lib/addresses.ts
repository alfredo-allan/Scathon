import { createPersistedStore } from "./createPersistedStore";
import { formatCep } from "./viaCep";

export interface SavedAddress {
  id: string;
  /** Short name the customer gives it, e.g. "Casa", "Trabalho". */
  label: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

// One seeded address for the mock customer (see `@/lib/accounts`'s
// `SEED_ACCOUNT`) so `/account/addresses` and the cart's "entregar em um
// endereço salvo?" prompt have something real to show right away instead
// of an empty state on a fresh browser - same idea as `@/lib/orders`'
// mock order history. Fictional address, not tied to any real person.
const SEED_ADDRESS: SavedAddress = {
  id: "addr-seed-casa",
  label: "Casa",
  cep: "01310-100",
  street: "Avenida Paulista",
  number: "1000",
  complement: "Apto 42",
  neighborhood: "Bela Vista",
  city: "São Paulo",
  state: "SP",
};

/**
 * Same persisted-external-store shape as `cartStore`/`wishlistStore` (see
 * `createPersistedStore`'s doc comment) - a customer's saved delivery
 * addresses, read via `useSyncExternalStore` in `useSavedAddresses` below
 * wherever "want to ship to one of your saved addresses?" needs to be
 * offered (the product page's `<ShippingEstimator/>`, `<CartView/>`,
 * `/account/addresses`).
 *
 * No account backend yet, so this only persists to `localStorage` for
 * now - the real version is a `GET /api/addresses` read (mirroring
 * `getRecentOrders()`'s own doc comment on why a pure read stays
 * synchronous while writes below stay `async`).
 */
export const savedAddressesStore = createPersistedStore<SavedAddress[]>("scathon:addresses", [SEED_ADDRESS]);

function makeAddressId() {
  return `addr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Saves a new delivery address. `async`/`Promise`-returning for the same
 * reason as `@/lib/waitlist`'s `notifyInterest` - the future call is:
 *
 *   await fetch("/api/addresses", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify(address),
 *   });
 */
export async function saveAddress(address: Omit<SavedAddress, "id" | "cep"> & { cep: string }): Promise<SavedAddress> {
  const entry: SavedAddress = { ...address, id: makeAddressId(), cep: formatCep(address.cep) };
  savedAddressesStore.setValue((prev) => [...prev, entry]);
  return entry;
}

export async function removeAddress(id: string): Promise<void> {
  savedAddressesStore.setValue((prev) => prev.filter((address) => address.id !== id));
}
