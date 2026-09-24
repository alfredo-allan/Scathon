"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { CartLineItem } from "./CartLineItem";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/**
 * Mini-cart / cart-preview drawer - a lightweight abstraction of the real
 * `/cart` page (`<CartView/>`, which keeps its full shipping-confirmation
 * flow and stays exactly as it was). `<CartContext/>`'s `addItem` opens
 * this automatically the instant a product is added (see its own doc
 * comment for why that lives there instead of each call site remembering
 * to open it), so the shopper gets immediate "here's what you just added"
 * feedback without losing their place on whatever page they were on -
 * closing it (✕, the backdrop, Escape, or "Continuar Comprando") just
 * gets out of the way and leaves them exactly where they were.
 *
 * Slides in from the right, on every breakpoint (mobile included, unlike
 * `<DrawerMenu/>` which is desktop/tablet *and* mobile from the left but
 * only ever needs a nav-link-width `w-1/2 max-w-sm`). Product rows need
 * real room for an image, price and quantity stepper, so this one is
 * wider: `w-[88%] max-w-sm` on mobile (proportional to the screen, per
 * the request, while still leaving a sliver of backdrop to tap-to-close),
 * `sm:w-full sm:max-w-md` from tablet up (a fixed ~448px pane).
 *
 * "Finalizar Compra" below routes to `/cart`, not straight to
 * `/checkout` - `<CheckoutView/>` refuses to render anything past a
 * prompt until `selection.confirmedAt` is set, and that shipping-method
 * step only lives on `/cart`, so sending the shopper there first is what
 * actually gets them to checkout fastest. This drawer intentionally
 * doesn't try to calculate shipping or show a free-shipping progress bar
 * itself - that whole flow (CEP lookup, Melhor Envio quotes) belongs to
 * `<CartView/>` alone, so it isn't duplicated here.
 */
export function CartDrawer() {
  const { items, cartCount, totalAmount, updateQuantity, removeItem, isDrawerOpen, closeCartDrawer } = useCart();

  // Lock body scroll and let Escape close it, same as <DrawerMenu/> plus
  // an Escape handler (cheap to add, and this one opens itself
  // automatically rather than only from a deliberate click, so a fast
  // keyboard-driven dismissal is worth having).
  useEffect(() => {
    if (!isDrawerOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeCartDrawer();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawerOpen, closeCartDrawer]);

  return (
    <>
      <div
        aria-hidden={!isDrawerOpen}
        onClick={closeCartDrawer}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
          isDrawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Carrinho, ${cartCount} ${cartCount === 1 ? "item" : "itens"}`}
        className={`fixed right-0 top-0 z-50 flex h-full w-[88%] max-w-sm flex-col bg-white transition-transform duration-300 ease-out dark:bg-neutral-900 sm:w-full sm:max-w-md ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
          <span className="text-sm font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
            Carrinho{cartCount > 0 ? ` (${cartCount})` : ""}
          </span>
          <button
            type="button"
            onClick={closeCartDrawer}
            aria-label="Fechar carrinho"
            className="p-1 text-neutral-600 dark:text-neutral-400"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Seu carrinho está vazio.</p>
            <Link
              href="/"
              onClick={closeCartDrawer}
              className="rounded-app bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
            >
              Ver produtos
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4">
              <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-900">
                {items.map((item) => (
                  <CartLineItem
                    key={`${item.productId}-${item.color}-${item.size}`}
                    item={item}
                    compact
                    onIncrease={() => updateQuantity(item.productId, item.color, item.size, item.quantity + 1)}
                    onDecrease={() => updateQuantity(item.productId, item.color, item.size, item.quantity - 1)}
                    onRemove={() => removeItem(item.productId, item.color, item.size)}
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-200 px-4 py-4 dark:border-neutral-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">Subtotal</span>
                <span className="text-base font-semibold text-neutral-950 dark:text-neutral-50">
                  {currencyFormatter.format(totalAmount)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">Frete calculado no carrinho.</p>

              <Link
                href="/cart"
                onClick={closeCartDrawer}
                className="mt-4 block w-full rounded-app bg-neutral-950 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
              >
                Finalizar Compra
              </Link>
              <button
                type="button"
                onClick={closeCartDrawer}
                className="mt-2 w-full rounded-app border border-neutral-300 py-3.5 text-xs font-semibold uppercase tracking-widest text-neutral-900 transition-colors hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
              >
                Continuar Comprando
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
