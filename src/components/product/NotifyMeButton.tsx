"use client";

import { useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import { notifyInterest, waitlistStore } from "@/lib/waitlist";

interface NotifyMeButtonProps {
  productId: string;
  productTitle: string;
  /**
   * `"sm"` is the compact, collapsed-by-default variant used on
   * `<ProductCard/>` (space is tight in a grid tile). `"lg"` is the full
   * width variant used on the detail page's buy box, where it takes the
   * place "Adicionar ao carrinho" would normally occupy.
   */
  size?: "sm" | "lg";
  /** The apparel size the visitor currently has selected, if any - stored
   * alongside their email so a future backend knows which size to restock/
   * notify for first. Ignored on the "sm" (card) variant, which has no size
   * selector to read from. */
  selectedSize?: string | null;
  /** Skip the collapsed "Avise-me" button and show the email form right
   * away. Used on the "lg" (PDP) variant, where there's room for it and
   * it's the primary action on the page; the "sm" (card) variant always
   * starts collapsed regardless of this prop. */
  defaultOpen?: boolean;
}

/**
 * "Notify me when available" control for a `coming_soon` product (see
 * `Product.availability`) - the standard e-commerce pattern for a product
 * that can be browsed but not yet bought: capture an email, confirm, done.
 *
 * Same component powers both the compact card badge/button and the full
 * PDP buy-box control (`size` picks which), so the interaction and its
 * "already signed up" memory work identically everywhere it appears. Talks
 * to `@/lib/waitlist` for the actual persistence - see that module's doc
 * comment for how this becomes a real backend call later.
 */
export function NotifyMeButton({
  productId,
  productTitle,
  size = "lg",
  selectedSize,
  defaultOpen = false,
}: NotifyMeButtonProps) {
  // Read the shared waitlist store via useSyncExternalStore (not
  // useEffect+setState - see waitlistStore's doc comment) so "did this
  // visitor already join this product's waitlist" is both hydration-safe
  // and known from the very first client render.
  const entries = useSyncExternalStore(
    waitlistStore.subscribe,
    waitlistStore.getSnapshot,
    waitlistStore.getServerSnapshot,
  );
  const existingEntry = useMemo(
    () => entries.find((entry) => entry.productId === productId),
    [entries, productId],
  );

  const [isOpen, setIsOpen] = useState(size === "lg" && defaultOpen);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const status: "idle" | "submitting" | "done" = existingEntry
    ? "done"
    : isSubmitting
      ? "submitting"
      : "idle";
  const confirmedEmail = existingEntry?.email ?? email;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    await notifyInterest(productId, trimmed, selectedSize ?? undefined);
    setIsSubmitting(false);
  }

  const isCompact = size === "sm";

  if (status === "done") {
    return (
      <div
        className={
          isCompact
            ? "mt-2 flex items-center gap-1.5 rounded-app border border-neutral-300 px-2 py-2 text-[10px] font-medium uppercase tracking-widest text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
            : "flex w-full items-start gap-2.5 rounded-app border border-neutral-300 px-4 py-3.5 text-sm text-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
        }
      >
        <svg
          viewBox="0 0 24 24"
          className={isCompact ? "h-3.5 w-3.5 shrink-0" : "mt-0.5 h-4 w-4 shrink-0"}
          fill="none"
          aria-hidden
        >
          <path
            d="M4.5 12.75l5.5 5.5L19.5 7.75"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {isCompact ? (
          <span>Vamos te avisar</span>
        ) : (
          <span>
            Prontinho - vamos te avisar em <strong>{confirmedEmail}</strong> assim que{" "}
            <strong>{productTitle}</strong> chegar.
          </span>
        )}
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          isCompact
            ? "mt-2 w-full rounded-app border border-neutral-300 py-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-700 transition-colors hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500"
            : "w-full rounded-app border border-neutral-300 py-3.5 text-xs font-semibold uppercase tracking-widest text-neutral-900 transition-colors hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
        }
      >
        Avise-me quando disponível
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={isCompact ? "mt-2 flex gap-1.5" : "flex flex-col gap-2 sm:flex-row"}
    >
      <input
        type="email"
        required
        autoFocus
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="seu@email.com"
        className={
          isCompact
            ? "min-w-0 flex-1 rounded-app border border-neutral-300 bg-transparent px-2 py-2 text-xs outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100"
            : "w-full flex-1 rounded-app border border-neutral-300 bg-transparent px-3 py-3.5 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100"
        }
      />
      <button
        type="submit"
        disabled={status === "submitting"}
        className={
          isCompact
            ? "shrink-0 rounded-app bg-neutral-950 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-950"
            : "shrink-0 rounded-app bg-neutral-950 px-6 py-3.5 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-950"
        }
      >
        {status === "submitting" ? (isCompact ? "..." : "Enviando…") : isCompact ? "OK" : "Avise-me"}
      </button>
    </form>
  );
}
