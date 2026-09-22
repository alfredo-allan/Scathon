'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import type { DividerSlide } from '@/types'

interface CategoryDividerCarouselProps {
  slides: DividerSlide[]
}

/**
 * Section divider embedded between product grids: a responsive banner
 * carousel that breaks up the page rhythm.
 */
export function CategoryDividerCarousel({ slides }: CategoryDividerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const goNext = useCallback(() => setActiveIndex((index) => (index + 1) % slides.length), [slides.length])

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(goNext, 5000)
    return () => clearInterval(timer)
  }, [slides.length, goNext])

  if (slides.length === 0) return null

  return (
    <section aria-label="Navegar por categorias" className="relative w-full overflow-hidden">
      <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
        {slides.map((slide) => (
          <div key={slide.id} className="group relative block w-full shrink-0">
            {/* Mobile: dedicated portrait crop (matches the real assets'
                own 1536×2752 shape instead of an arbitrary default). */}
            <div className="relative aspect-[9/16] md:hidden">
              <Image
                src={slide.mobileImageUrl}
                alt={slide.title}
                fill
                unoptimized
                sizes="100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            {/* Tablet/desktop: one wide 21:9 banner covers both - see the
                `desktopImageUrl` doc comment on `DividerSlide`. */}
            <div className="relative hidden aspect-[21/9] md:block">
              <Image
                src={slide.desktopImageUrl}
                alt={slide.title}
                fill
                unoptimized
                sizes="100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="text-lg font-semibold uppercase tracking-widest text-white">{slide.title}</span>
            </div>
          </div>
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
              className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
