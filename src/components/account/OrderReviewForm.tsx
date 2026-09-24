"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { orderReviewsStore, submitOrderReview } from "@/lib/orderReviews";

interface OrderReviewFormProps {
  slug: string;
  title: string;
}

/**
 * Inline "avalie este produto" control for a line item on `/account/orders`
 * - the "espaço para avaliar um produto" the account panel needs. Same
 * three-state shape as `<NotifyMeButton/>` (collapsed prompt → open form →
 * done confirmation), reading `orderReviewsStore` via `useSyncExternalStore`
 * so "already reviewed" survives a reload without an effect.
 */
export function OrderReviewForm({ slug, title }: OrderReviewFormProps) {
  const reviews = useSyncExternalStore(
    orderReviewsStore.subscribe,
    orderReviewsStore.getSnapshot,
    orderReviewsStore.getServerSnapshot,
  );
  const existing = reviews[slug];

  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (existing) {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
        <span aria-hidden className="flex text-neutral-900 dark:text-neutral-100">
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index}>{index < existing.rating ? "★" : "☆"}</span>
          ))}
        </span>
        <span>Você avaliou este produto</span>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-2 text-xs font-semibold uppercase tracking-widest text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
      >
        Avaliar produto
      </button>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (rating === 0) return;
    setIsSubmitting(true);
    await submitOrderReview(slug, rating, comment.trim());
    setIsSubmitting(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 flex flex-col gap-2.5 rounded-app border border-neutral-200 p-3 dark:border-neutral-800"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
        Avaliar {title}
      </p>

      <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
        {Array.from({ length: 5 }, (_, index) => {
          const value = index + 1;
          const filled = value <= (hoverRating || rating);
          return (
            <button
              key={value}
              type="button"
              aria-label={`${value} de 5 estrelas`}
              onMouseEnter={() => setHoverRating(value)}
              onClick={() => setRating(value)}
              className="p-0.5 text-lg leading-none text-neutral-900 dark:text-neutral-100"
            >
              {filled ? "★" : "☆"}
            </button>
          );
        })}
      </div>

      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Conte como foi usar o produto (opcional)"
        rows={2}
        className="w-full resize-none rounded-app border border-neutral-300 bg-transparent px-2.5 py-2 text-xs outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100"
      />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={rating === 0 || isSubmitting}
          className="rounded-app bg-neutral-950 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-950"
        >
          {isSubmitting ? "Enviando…" : "Enviar avaliação"}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
