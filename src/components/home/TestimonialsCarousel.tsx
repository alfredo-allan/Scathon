"use client";

import Image from "next/image";
import { config } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram } from "@fortawesome/free-brands-svg-icons";
import { useState } from "react";
import type { ProductReview } from "@/lib/reviews";

// Render icons as plain inline SVG sized by our own Tailwind classes,
// instead of FontAwesome auto-injecting its own <style> tag with
// default sizing/CSS (which briefly flashes oversized icons on load).
config.autoAddCss = false;

function Stars({ rating }: { rating: number }) {
  return (
    <div aria-hidden className="flex gap-0.5 text-base leading-none">
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={
            index < rating
              ? "text-neutral-900 dark:text-neutral-100"
              : "text-neutral-300 dark:text-neutral-700"
          }
        >
          ★
        </span>
      ))}
    </div>
  );
}

function TestimonialCard({ review, duplicate = false }: { review: ProductReview; duplicate?: boolean }) {
  const instagramUrl = review.instagramHandle
    ? `https://instagram.com/${review.instagramHandle.replace(/^@/, "")}`
    : null;

  return (
    <figure
      aria-hidden={duplicate}
      className="w-72 sm:w-80 shrink-0 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6"
    >
      <Stars rating={review.rating} />
      <blockquote className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        {review.comment}
      </blockquote>

      <div className="mt-4 flex items-center gap-3 border-t border-neutral-100 dark:border-neutral-800 pt-4">
        {review.photoUrl ? (
          <Image
            src={review.photoUrl}
            alt={review.author}
            width={36}
            height={36}
            unoptimized
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
          >
            {review.author.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-neutral-900 dark:text-neutral-100">{review.author}</p>
          {review.instagramHandle && (
            <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-500">{review.instagramHandle}</p>
          )}
        </div>
        {/*
          Both copies stay fully clickable - the marquee keeps scrolling,
          so the "duplicate" half is genuinely on screen half the time
          and a mouse user should still be able to open the profile from
          it. Only keyboard focus is skipped on the duplicate (tabIndex
          -1), matching its figure-level aria-hidden so screen-reader/
          keyboard users don't tab into content announced as hidden.
        */}
        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            tabIndex={duplicate ? -1 : 0}
            aria-label={`Ver perfil de ${review.author} no Instagram`}
            className="shrink-0 p-1.5 text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            <FontAwesomeIcon icon={faInstagram} className="h-4 w-4" aria-hidden />
          </a>
        )}
      </div>
    </figure>
  );
}

/**
 * Continuously auto-scrolling reviews marquee (slow, constant speed - not
 * a slide-by-slide carousel like HeroCarousel). Touching or clicking
 * anywhere on the track pauses it in place - via `pointerenter`/
 * `pointerleave`, which fires for both mouse hover *and* a touch
 * press/release - so a shopper can read the full quote and count the
 * stars before it drifts on. The track renders the list twice and
 * animates exactly -50%, looping seamlessly.
 *
 * `reviews` vem de `getFeaturedReviews()` (`GET /api/v1/reviews/featured`),
 * buscado no servidor por `<Home/>` (`src/app/page.tsx`) - são avaliações
 * REAIS (nota alta + comentário de verdade), nunca mais os 7 depoimentos
 * fabricados que viviam em `src/data/testimonials.ts` (apagado - pedido do
 * Alfredo em 2026-10-11: "apagar os comentários que são fakes do site").
 * Sem avaliação real suficiente ainda pra mostrar, a seção inteira some
 * (ver `<Home/>`) em vez de aparecer vazia ou com depoimento inventado.
 *
 * `MIN_REVIEWS_TO_LOOP` (2026-10-11, bug reportado pelo Alfredo via
 * screenshot: a avaliação dele aparecia repetida duas vezes seguidas) - a
 * duplicação da lista acima só faz sentido visual quando há avaliação de
 * sobra pra preencher a largura da tela antes de repetir; com só 1 (ou
 * poucas) avaliação(ões), as duas metades do track ficam lado a lado e
 * PARECEM um bug de card duplicado, não um loop contínuo. Abaixo desse
 * número, mostra uma fileira estática (sem duplicar, sem animar) - ainda
 * perfeitamente navegável (scroll horizontal normal se não couber na
 * tela), só sem o efeito de esteira. Loja com poucas avaliações ainda hoje
 * (é exatamente o caso do Alfredo agora) vai crescer esse número com o
 * tempo via convites - o valor de corte (4) é arbitrário, ajustável sem
 * nenhuma outra mudança.
 *
 * A fileira estática ficava com `overflow-hidden` herdado do wrapper (que
 * só existe pra esconder a metade duplicada da esteira e aplicar o
 * degradê nas bordas) - sem rolagem nenhuma, os cards que não cabem na
 * tela ficavam cortados e inacessíveis em vez de roláveis (bug reportado
 * pelo Alfredo em 2026-10-14: sumia a rolagem no mobile com poucas
 * avaliações, mas "passava despercebido" no desktop porque lá os poucos
 * cards normalmente já cabem inteiros na tela). Agora o wrapper só usa
 * `overflow-hidden` + a máscara quando está de fato em modo esteira
 * (`shouldLoop`); fora disso vira `overflow-x-auto no-scrollbar` (mesmo
 * padrão de rolagem horizontal já usado em CategoryBar), que permite
 * arrastar/rolar em qualquer tela onde os cards não couberem - no
 * desktop, onde já cabem, não aparece barra nem muda nada visualmente.
 */
const MIN_REVIEWS_TO_LOOP = 4;

export function TestimonialsCarousel({ reviews }: { reviews: ProductReview[] }) {
  const [isPaused, setIsPaused] = useState(false);

  const pause = () => setIsPaused(true);
  const resume = () => setIsPaused(false);

  const shouldLoop = reviews.length >= MIN_REVIEWS_TO_LOOP;

  return (
    <section
      aria-label="Avaliações de clientes"
      className="border-t border-neutral-100 dark:border-neutral-800 py-10"
    >
      <h2 className="px-4 md:px-8 text-sm font-semibold uppercase tracking-widest mb-6 text-neutral-900 dark:text-neutral-100">
        O que dizem nossos clientes
      </h2>

      <div
        className={
          shouldLoop
            ? "overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]"
            : "overflow-x-auto no-scrollbar"
        }
      >
        {shouldLoop ? (
          <div
            role="group"
            aria-label="Carrossel de avaliações - toque ou clique para pausar"
            className="flex w-max gap-4 animate-marquee"
            style={{ animationPlayState: isPaused ? "paused" : "running" }}
            onPointerEnter={pause}
            onPointerLeave={resume}
            onPointerDown={pause}
            onPointerUp={resume}
            onPointerCancel={resume}
          >
            {reviews.map((review) => (
              <TestimonialCard key={`a-${review.id}`} review={review} />
            ))}
            {reviews.map((review) => (
              <TestimonialCard key={`b-${review.id}`} review={review} duplicate />
            ))}
          </div>
        ) : (
          <div role="group" aria-label="Avaliações de clientes" className="flex gap-4 px-4 md:px-8">
            {reviews.map((review) => (
              <TestimonialCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
