'use client'

import Image from 'next/image'
import { useState } from 'react'

interface ProductGalleryProps {
  images: string[]
  title: string
}

/**
 * Product photo gallery: one large main image with a row of clickable
 * thumbnails directly beneath it - same layout on every breakpoint, mobile
 * included. Tapping/clicking a thumbnail swaps the main image to match, so
 * there's exactly one interaction model to learn instead of "drag on phone,
 * click a side rail on desktop."
 *
 * This replaces the previous split design (a vertical thumbnail rail next
 * to the main image on desktop; a swipeable, infinite-loop carousel with
 * dot indicators on mobile) - Alfredo asked for the thumbnails to live
 * below the main photo instead of in a side column, and for mobile to get
 * the same click-a-thumbnail interaction rather than a swipe carousel.
 * Dropping the carousel also means dropping its drag/swipe plumbing
 * (pointer handlers, drag offset, infinite wraparound) entirely - there's
 * nothing left to swipe between.
 *
 * Tile background is `bg-neutral-300 dark:bg-neutral-700` - a deliberately
 * mid-toned choice, not the lighter/darker `100`/`900` used elsewhere. Real
 * product photos with their background removed get flattened to solid white
 * (no alpha in .jpeg), so a white garment shot on a near-white tile (or a
 * black garment shot on a near-black tile in dark mode) nearly disappears.
 * Pulling both themes' tile shade toward the middle keeps it "following the
 * theme" while staying visible against either a white or black cutout - an
 * opaque photo that already fills the tile edge-to-edge is unaffected.
 */
export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const total = images.length

  return (
    <div>
      <div className="relative mx-auto aspect-[3/4] w-full max-w-xl overflow-hidden bg-neutral-300 dark:bg-neutral-700 md:max-w-2xl">
        <Image
          src={images[activeIndex]}
          alt={`${title} - foto ${activeIndex + 1}`}
          fill
          unoptimized
          priority
          sizes="(min-width: 1024px) 42rem, 100vw"
          className="object-cover"
        />
      </div>

      {total > 1 && (
        // Thumbnails are `flex-1` (no fixed width, no `shrink-0`) so the row
        // grows to fill the exact same width as the main photo above it
        // instead of sitting bunched at the left with empty space on the
        // right - the fewer photos a product has, the bigger each thumbnail
        // gets. No `overflow-x-auto` either: there's nothing to scroll to
        // once every thumbnail already shares the row equally.
        <div className="mx-auto mt-3 flex max-w-xl gap-2 md:max-w-2xl">
          {images.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-current={index === activeIndex}
              aria-label={`Ver foto ${index + 1} de ${title}`}
              className={`relative aspect-[3/4] flex-1 overflow-hidden bg-neutral-300 transition-opacity dark:bg-neutral-700 ${
                index === activeIndex ? 'ring-1 ring-neutral-950 dark:ring-neutral-50' : 'opacity-60 hover:opacity-100'
              }`}>
              <Image src={src} alt="" fill unoptimized sizes="25vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
