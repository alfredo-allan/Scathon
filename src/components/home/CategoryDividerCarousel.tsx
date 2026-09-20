"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { DividerSlide } from "@/types";

interface CategoryDividerCarouselProps {
  slides: DividerSlide[];
}

/**
 * Section divider embedded between product grids: a responsive banner
 * carousel that breaks up the page rhythm and cross-links into
 * categories.
 */
export function CategoryDividerCarousel({ slides }: CategoryDividerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const goNext = useCallback(
    () => setActiveIndex((index) => (index + 1) % slides.length),
    [slides.length],
  );

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(goNext, 5000);
    return () => clearInterval(timer);
  }, [slides.length, goNext]);

  if (slides.length === 0) return null;

  return (
    <section aria-label="Navegar por categorias" className="relative w-full overflow-hidden">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {slides.map((slide) => (
          <Link
            key={slide.id}
            href={slide.href}
            className="group relative block aspect-[16/9] md:aspect-[21/9] w-full shrink-0"
          >
            <Image
              src={slide.imageUrl}
              alt={slide.title}
              fill
              unoptimized
              sizes="100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="text-lg font-semibold uppercase tracking-widest text-white">
                {slide.title}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Ir para ${slide.title}`}
              onClick={() => setActiveIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex ? "w-6 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
