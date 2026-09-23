'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useTheme } from '@/hooks/useTheme'

// Repeated enough times that even a very wide ultra-wide monitor never
// sees the loop seam scroll into view before it wraps back around.
const REPEAT_COUNT = 6

/**
 * Continuously auto-scrolling brand marquee - a "letreiro" imitating big
 * city billboard/signage strips: the wordmark and "SCATHON 2026" loop
 * edge-to-edge, with the logo itself doubling as the separator between
 * each repetition of the text (no extra bullet/divider needed).
 *
 * Reuses the exact same infinite-loop mechanism already established by
 * `<TestimonialsCarousel/>`: the shared global `.animate-marquee` keyframe
 * (see globals.css - translateX 0 to -50%, paused automatically under
 * `prefers-reduced-motion`), a track rendered twice back-to-back so the
 * -50% animation loops seamlessly, and the same pointer-based
 * pause-on-hover/touch/drag behavior.
 *
 * Picks the logo file via `useTheme()` (JS) rather than the two-image
 * `dark:hidden`/`dark:block` CSS-toggle pattern used elsewhere (Header,
 * FloatingDock). With `REPEAT_COUNT * 2` logo instances already in the
 * DOM, rendering both PNGs at every one of those (only ever one visible)
 * would double the images in an already-repetitive strip for nothing -
 * reading the theme directly and rendering exactly one <Image> per
 * instance keeps the DOM proportional to what's actually shown. The
 * light/dark pairing itself matches every other themed logo in the app:
 * light theme -> dark-ink mark, dark theme -> light-ink mark.
 */
export function BrandMarquee() {
  const { theme } = useTheme()
  const [isPaused, setIsPaused] = useState(false)

  const logoSrc = theme === 'dark' ? '/branding/BradingLogoLigth.png' : '/branding/BrandigLogoDark.png'

  const pause = () => setIsPaused(true)
  const resume = () => setIsPaused(false)

  const units = Array.from({ length: REPEAT_COUNT * 2 })

  return (
    // Purely decorative repetition of the brand name - no unique
    // information per instance (unlike TestimonialsCarousel's reviews),
    // so the whole scrolling track is `aria-hidden` and the section itself
    // carries the one meaningful label instead.
    <section aria-label="Scathon 2026" className="border-y border-neutral-100 dark:border-neutral-800 py-6 sm:py-8">
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
        <div
          aria-hidden
          className="flex w-max items-center gap-8 animate-marquee sm:gap-12 lg:gap-16"
          style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
          onPointerEnter={pause}
          onPointerLeave={resume}
          onPointerDown={pause}
          onPointerUp={resume}
          onPointerCancel={resume}>
          {units.map((_, index) => (
            <div key={index} className="flex shrink-0 items-center gap-8 sm:gap-12 lg:gap-16">
              <Image src={logoSrc} alt="" width={500} height={211} unoptimized className="h-7 w-auto object-contain sm:h-9 lg:h-12" />
              <span className="whitespace-nowrap text-3xl font-extrabold uppercase tracking-tight text-neutral-950 dark:text-neutral-50 sm:text-4xl lg:text-6xl">
                Apocalipse 2026
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
