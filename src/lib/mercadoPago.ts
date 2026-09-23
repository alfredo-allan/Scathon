import type { CartItem } from "@/types";

export interface CheckoutTotals {
  subtotal: number;
  shipping: number;
  total: number;
}

export interface PlacedOrder {
  id: string;
  placedAt: string;
  itemCount: number;
  amountCharged: number;
}

/**
 * No Mercado Pago credentials (access token + public key) exist for this
 * project yet, so there's nothing real to call - this only generates a
 * mock order id/timestamp, same seam style as `@/lib/orderReviews` and
 * `@/lib/waitlist` (already `async`/`Promise`-returning so the swap later
 * is a one-function change, no caller update needed).
 *
 * The real version becomes a call to create a Mercado Pago Checkout Pro
 * preference and a redirect to its `init_point`:
 *
 *   const response = await fetch("/api/checkout/create-preference", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ items, totals, shipping: shippingSelection }),
 *   });
 *   const { init_point } = await response.json();
 *   window.location.href = init_point;
 *
 * `<CheckoutView/>`, the only caller, would swap its "pedido confirmado"
 * success screen for that redirect and nothing else changes.
 */
export async function submitCheckout(
  items: CartItem[],
  totals: CheckoutTotals,
): Promise<PlacedOrder> {
  await new Promise((resolve) => setTimeout(resolve, 700));

  const id = `SCT-${Math.floor(100000 + Math.random() * 900000)}`;
  return {
    id,
    placedAt: new Date().toISOString(),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    amountCharged: totals.total,
  };
}
