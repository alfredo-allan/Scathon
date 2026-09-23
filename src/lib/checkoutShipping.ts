import { createPersistedStore } from "./createPersistedStore";
import type { ViaCepAddress } from "./viaCep";
import type { ShippingQuote } from "./melhorEnvio";

export type DeliveryMethod = "melhor_envio" | "combinar_com_vendedor";

export interface ShippingSelection {
  method: DeliveryMethod | null;
  cep: string;
  address: ViaCepAddress | null;
  quote: ShippingQuote | null;
  /** Buyer's note when `method` is "combinar_com_vendedor" (preferred pickup day, alternate carrier, etc). */
  customNote: string;
  /** Set once "Confirmar envio" is pressed in `<CartView/>` - `<CheckoutView/>` refuses to render the order summary until this is set. */
  confirmedAt: string | null;
}

export const EMPTY_SHIPPING_SELECTION: ShippingSelection = {
  method: null,
  cep: "",
  address: null,
  quote: null,
  customNote: "",
  confirmedAt: null,
};

/**
 * Carries the buyer's shipping choice from `<CartView/>` (where it's built,
 * step by step: CEP → resolved address → Melhor Envio quote, or "combinar
 * com o vendedor" instead) over to `<CheckoutView/>` (where it's only ever
 * read and shown for confirmation). Same persisted-external-store shape as
 * the cart/wishlist stores; kept separate from `cartStore` itself since this
 * is checkout-flow state, not part of what's actually in the bag - clearing
 * it on a successful order (see `resetShippingSelection`) shouldn't, and
 * doesn't, touch the cart's own persistence.
 */
export const checkoutShippingStore = createPersistedStore<ShippingSelection>(
  "scathon:checkout-shipping",
  EMPTY_SHIPPING_SELECTION,
);

export function resetShippingSelection(): void {
  checkoutShippingStore.setValue(EMPTY_SHIPPING_SELECTION);
}
