"use client";

import Image from "next/image";
import { config } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram } from "@fortawesome/free-brands-svg-icons";
import { useState } from "react";
import type { Testimonial } from "@/types";
import { testimonials } from "@/data/testimonials";

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

function TestimonialCard({
  testimonial,
  duplicate = false,
}: {
  testimonial: Testimonial;
  duplicate?: boolean;
}) {
  return (
    <figure
      aria-hidden={duplicate}
      className="w-72 sm:w-80 shrink-0 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6"
    >
      <Stars rating={testimonial.rating} />
      <figcaption className="mt-3 text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
        {testimonial.title}
      </figcaption>
      <blockquote className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        {testimonial.quote}
      </blockquote>

      <div className="mt-4 flex items-center gap-3 border-t border-neutral-100 dark:border-neutral-800 pt-4">
        <Image
          src={testimonial.avatarUrl}
          alt={testimonial.author}
          width={36}
          height={36}
          unoptimized
          className="h-9 w-9 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-neutral-900 dark:text-neutral-100">
            {testimonial.author}
          </p>
          <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-500">
            {testimonial.instagramHandle}
          </p>
        </div>
        {/*
          Both copies stay fully clickable - the marquee keeps scrolling,
          so the "duplicate" half is genuinely on screen half the time
          and a mouse user should still be able to open the profile from
          it. Only keyboard focus is skipped on the duplicate (tabIndex
          -1), matching its figure-level aria-hidden so screen-reader/
          keyboard users don't tab into content announced as hidden.
        */}
        <a
          href={testimonial.instagramUrl}
          target="_blank"
          rel="noreferrer"
          tabIndex={duplicate ? -1 : 0}
          aria-label={`Ver perfil de ${testimonial.author} no Instagram`}
          className="shrink-0 p-1.5 text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <FontAwesomeIcon icon={faInstagram} className="h-4 w-4" aria-hidden />
        </a>
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
 */
export function TestimonialsCarousel() {
  const [isPaused, setIsPaused] = useState(false);

  const pause = () => setIsPaused(true);
  const resume = () => setIsPaused(false);

  return (
    <section
      aria-label="Avaliações de clientes"
      className="border-t border-neutral-100 dark:border-neutral-800 py-10"
    >
      <h2 className="px-4 md:px-8 text-sm font-semibold uppercase tracking-widest mb-6 text-neutral-900 dark:text-neutral-100">
        O que dizem nossos clientes
      </h2>

      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
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
          {testimonials.map((testimonial) => (
            <TestimonialCard key={`a-${testimonial.id}`} testimonial={testimonial} />
          ))}
          {testimonials.map((testimonial) => (
            <TestimonialCard
              key={`b-${testimonial.id}`}
              testimonial={testimonial}
              duplicate
            />
          ))}
        </div>
      </div>
    </section>
  );
}
