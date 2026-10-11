"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { ApiError, getReviewInvite, submitReviewInvite, type ReviewInviteInfo } from "@/lib/reviews";

/**
 * Página pública `/avaliar/[token]` - o link SEM LOGIN que o admin manda pro
 * cliente (pedido do Alfredo, 2026-10-11: "manda link ou algo mais simples
 * e objetivo [...] para ele somente postar o comentário"). O próprio token
 * na URL já é a autorização - nenhuma chamada daqui usa `useAuth()`/sessão
 * nenhuma, mesmo que o visitante esteja logado em outra aba.
 *
 * Nota+comentário são obrigatórios (`rating === 0` ou `comment` vazio
 * desabilitam o envio); foto+Instagram são opcionais - mesma regra
 * confirmada com o Alfredo.
 */
export function ReviewInviteView({ token }: { token: string }) {
  const [invite, setInvite] = useState<ReviewInviteInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    getReviewInvite(token)
      .then(setInvite)
      .catch((err) => {
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "Não foi possível carregar este link agora - tenta de novo em instantes.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  // Preview local da foto escolhida - gerada no navegador (nunca enviada
  // separadamente), só pra o cliente confirmar que escolheu a foto certa
  // antes de enviar. `URL.revokeObjectURL` no cleanup evita acumular
  // objetos na memória a cada troca de foto.
  useEffect(() => {
    if (!photo) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    setPhoto(event.target.files?.[0] ?? null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (rating === 0 || !comment.trim()) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await submitReviewInvite(token, {
        rating,
        comment: comment.trim(),
        instagramHandle: instagramHandle.trim() || undefined,
        photo,
      });
      setIsDone(true);
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : "Não foi possível enviar agora - tenta de novo em instantes.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Carregando…</p>
      </div>
    );
  }

  if (loadError || !invite) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{loadError}</p>
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-widest text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
        >
          Voltar pra loja
        </Link>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
          Obrigado pela avaliação!
        </p>
        <p className="max-w-sm text-sm text-neutral-600 dark:text-neutral-400">
          Sua avaliação de {invite.productTitle} foi publicada.
        </p>
        <Link
          href="/"
          className="mt-2 rounded-app bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
        >
          Voltar pra loja
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10 md:px-8">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
        Avaliar produto
      </p>
      <h1 className="mt-1 text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
        {invite.productTitle}
      </h1>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Pedido {invite.orderId}</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            Sua nota
          </label>
          <div className="mt-1 flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
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
                  className="p-1 text-2xl leading-none text-neutral-900 dark:text-neutral-100"
                >
                  {filled ? "★" : "☆"}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label
            htmlFor="review-invite-comment"
            className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400"
          >
            Seu comentário
          </label>
          <textarea
            id="review-invite-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Conte como foi usar o produto"
            rows={4}
            maxLength={1000}
            required
            className="mt-1 w-full resize-none rounded-app border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100"
          />
        </div>

        <div>
          <label
            htmlFor="review-invite-instagram"
            className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400"
          >
            Instagram (opcional)
          </label>
          <input
            id="review-invite-instagram"
            type="text"
            value={instagramHandle}
            onChange={(event) => setInstagramHandle(event.target.value)}
            placeholder="@seu.perfil"
            className="mt-1 w-full rounded-app border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            Foto (opcional)
          </label>
          <div className="mt-1 flex items-center gap-3">
            {photoPreviewUrl && (
              <Image
                src={photoPreviewUrl}
                alt="Pré-visualização da foto escolhida"
                width={56}
                height={56}
                unoptimized
                className="h-14 w-14 rounded-app object-cover"
              />
            )}
            <label className="cursor-pointer rounded-app border border-neutral-300 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-900 dark:border-neutral-700 dark:text-neutral-100">
              {photo ? "Trocar foto" : "Adicionar foto"}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handlePhotoChange} className="hidden" />
            </label>
          </div>
        </div>

        {submitError && <p className="text-xs text-red-600 dark:text-red-400">{submitError}</p>}

        <button
          type="submit"
          disabled={rating === 0 || !comment.trim() || isSubmitting}
          className="mt-2 rounded-app bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-950"
        >
          {isSubmitting ? "Enviando…" : "Enviar avaliação"}
        </button>
      </form>
    </div>
  );
}
