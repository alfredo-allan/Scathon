"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HeroSlide } from "@/types";

interface HeroCarouselProps {
  slides: HeroSlide[];
  autoPlayMs?: number;
}

/**
 * Auto-playing hero banner with manual touch/drag support and indicator
 * dots. Scales to any number of slides. Renders a dedicated vertical image
 * on mobile (<640px), a mid-size crop on tablet (640-1024px), and a wide
 * banner on desktop (1024px+) via the `mobileImageUrl` / `tabletImageUrl` /
 * `desktopImageUrl` trio, so no cropping/art-direction is lost. Slides
 * without a `tabletImageUrl` fall back to `desktopImageUrl` for that tier.
 */
export function HeroCarousel({ slides, autoPlayMs = 6000 }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const dragDeltaX = useRef(0);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(((index % slides.length) + slides.length) % slides.length);
    },
    [slides.length],
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(goNext, autoPlayMs);
    return () => clearInterval(timer);
  }, [isPaused, slides.length, autoPlayMs, goNext]);

  const onPointerDown = (event: React.PointerEvent) => {
    dragStartX.current = event.clientX;
    dragDeltaX.current = 0;
    setIsPaused(true);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    dragDeltaX.current = event.clientX - dragStartX.current;
  };

  const onPointerUp = () => {
    const threshold = 50;
    if (dragDeltaX.current > threshold) goPrev();
    else if (dragDeltaX.current < -threshold) goNext();
    dragStartX.current = null;
    dragDeltaX.current = 0;
    setIsPaused(false);
  };

  if (slides.length === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Coleções em destaque"
      className="relative w-full overflow-hidden select-none touch-pan-y"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            aria-hidden={index !== activeIndex}
            className="relative w-full shrink-0"
          >
            {/* Mobile: dedicated vertical imagery. Aspect ratio matches the
                supplied asset itself (falls back to the classic 4:5 when a
                slide only ships a placeholder/no real dimensions apply). */}
            <div
              className="relative block sm:hidden"
              style={{ aspectRatio: slide.mobileAspectRatio ?? "4 / 5" }}
            >
              <Image
                src={slide.mobileImageUrl}
                alt={slide.title}
                fill
                unoptimized
                priority={index === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
            {/* Tablet: mid-size crop, falls back to the desktop image */}
            <div
              className="relative hidden sm:block lg:hidden"
              style={{ aspectRatio: slide.tabletAspectRatio ?? "16 / 10" }}
            >
              <Image
                src={slide.tabletImageUrl ?? slide.desktopImageUrl}
                alt={slide.title}
                fill
                unoptimized
                priority={index === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
            {/* Desktop: the carousel box itself stays a fixed 21:9 - it never
                grows/shrinks to match whatever photo is dropped in. The
                image fills that box edge-to-edge (`object-cover`, no bars),
                cropping whatever overflows. `object-top` anchors the crop to
                the top of the photo instead of the center, so a portrait-ish
                source keeps heads/faces in frame and loses leg/footwear
                space at the bottom instead. */}
            <div className="relative hidden lg:block lg:aspect-[21/9]">
              <Image
                src={slide.desktopImageUrl}
                alt={slide.title}
                fill
                unoptimized
                priority={index === 0}
                sizes="100vw"
                className="object-cover object-top"
              />
            </div>

            <div
              className={`absolute inset-0 flex flex-col items-start justify-end gap-2 p-6 md:p-12 ${
                slide.theme === "dark" ? "text-neutral-50" : "text-neutral-950"
              }`}
            >
              {slide.eyebrow && (
                <span className="text-xs font-semibold uppercase tracking-widest opacity-80">
                  {slide.eyebrow}
                </span>
              )}
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight max-w-md">
                {slide.title}
              </h2>
              {slide.subtitle && (
                <p className="text-sm md:text-base opacity-90 max-w-sm">
                  {slide.subtitle}
                </p>
              )}
              <Link
                href={slide.ctaHref}
                className={`mt-3 inline-block rounded-app px-6 py-3 text-xs font-semibold uppercase tracking-widest transition-colors ${
                  slide.theme === "dark"
                    ? "bg-neutral-50 text-neutral-950 hover:bg-neutral-200"
                    : "bg-neutral-950 text-neutral-50 hover:bg-neutral-800"
                }`}
              >
                {slide.ctaLabel}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Ir para o slide ${index + 1}`}
              aria-current={index === activeIndex}
              onClick={() => goTo(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex
                  ? "w-6 bg-white"
                  : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
