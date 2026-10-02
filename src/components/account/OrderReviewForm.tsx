"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ApiError, submitReview, type OwnReview } from "@/lib/reviews";

interface OrderReviewFormProps {
  slug: string;
  title: string;
  /** A avaliação que o cliente já escreveu pra este produto, se houver -
   * vem de `GET /me/reviews` buscado uma vez em `<AccountOrdersView/>` (não
   * mais de um cache próprio em `localStorage`), repassado pra cá pra que o
   * "você já avaliou" sobreviva a um reload sem precisar embutir essa
   * lógica de novo em cada item de pedido. */
  existingReview: OwnReview | null;
  /** Avisa o pai assim que o backend confirma a avaliação, pra ele atualizar
   * seu próprio mapa de "já avaliados" sem precisar refazer o fetch inteiro
   * de `GET /me/reviews`. */
  onSubmitted: (review: OwnReview) => void;
}

/**
 * Inline "avalie este produto" control for a line item on `/account/orders`
 * - the "espaço para avaliar um produto" the account panel needs. Fala de
 * verdade com o backend (`POST /api/v1/products/{slug}/reviews`, ver
 * `@/lib/reviews`) - que só aceita a avaliação se o cliente REALMENTE tiver
 * um pedido `entregue` com este produto; como este formulário só é
 * renderizado a partir de um item de pedido já `entregue` (ver
 * `<AccountOrdersView/>`), isso deveria sempre passar no uso normal, mas um
 * erro do backend ainda aparece na tela em vez de falhar silenciosamente.
 */
export function OrderReviewForm({ slug, title, existingReview, onSubmitted }: OrderReviewFormProps) {
  const { token } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (existingReview) {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
        <span aria-hidden className="flex text-neutral-900 dark:text-neutral-100">
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index}>{index < existingReview.rating ? "★" : "☆"}</span>
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
    if (rating === 0 || !token) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const { review } = await submitReview(slug, rating, comment, token);
      onSubmitted(review);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Não foi possível enviar agora - tenta de novo em instantes.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
        maxLength={1000}
        className="w-full resize-none rounded-app border border-neutral-300 bg-transparent px-2.5 py-2 text-xs outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100"
      />

      {errorMessage && <p className="text-[11px] text-red-600 dark:text-red-400">{errorMessage}</p>}

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
