"use client";

import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";

interface ProductGalleryProps {
  images: string[];
  title: string;
}

/**
 * Adaptive product photo gallery, built to scale from one photo to many
 * without ever looking like an accident (and to be reusable wherever else a
 * product needs a photo display - it only needs `images`/`title`, both of
 * which any `Product` can already supply):
 *
 *  - Desktop/tablet (md+): a vertical thumbnail rail next to one large main
 *    image. This replaces the old fixed 2-column tile grid, which looked
 *    fine at 4 photos but stretched into two huge, awkward tiles for a
 *    2-photo product. The main image is now capped to a sane size and the
 *    rail only renders once there's something to switch between.
 *  - Mobile (<md): a full-bleed, swipeable, infinite-loop carousel - swipe
 *    past the last photo and it wraps to the first (and vice-versa), so
 *    browsing never dead-ends. Dot indicators double as direct-jump taps.
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
  const [activeIndex, setActiveIndex] = useState(0);
  const total = images.length;

  const wrap = (index: number) => ((index % total) + total) % total;

  // --- mobile swipe/drag state ---
  // `trackWidth` is measured once per drag (in the pointerdown handler, not
  // during render) and kept in state rather than a ref, since reading a
  // ref's `.current` during render is unsafe (react-hooks/refs).
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [trackWidth, setTrackWidth] = useState(1);
  const startXRef = useRef(0);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (total <= 1) return;
    startXRef.current = event.clientX;
    setTrackWidth(trackRef.current?.clientWidth || 1);
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    setDragOffset(event.clientX - startXRef.current);
  }

  function endDrag() {
    if (!isDragging) return;
    const threshold = trackWidth * 0.18;
    if (dragOffset <= -threshold) {
      setActiveIndex((current) => wrap(current + 1));
    } else if (dragOffset >= threshold) {
      setActiveIndex((current) => wrap(current - 1));
    }
    setIsDragging(false);
    setDragOffset(0);
  }

  const dragPercentOfTrack = (dragOffset / trackWidth) * (100 / total);

  return (
    <div>
      {/* Desktop / tablet: thumbnail rail + large main image */}
      <div className="hidden gap-3 md:flex">
        {total > 1 && (
          <div className="flex w-16 shrink-0 flex-col gap-2 lg:w-20">
            {images.map((src, index) => (
              <button
                key={`${src}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-current={index === activeIndex}
                aria-label={`Ver foto ${index + 1} de ${title}`}
                className={`relative aspect-[3/4] overflow-hidden bg-neutral-300 transition-opacity dark:bg-neutral-700 ${
                  index === activeIndex ? "" : "opacity-60 hover:opacity-100"
                }`}
              >
                <Image src={src} alt="" fill unoptimized sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
        <div className="relative max-h-[calc(100vh-8rem)] w-full max-w-2xl flex-1 aspect-[3/4] overflow-hidden bg-neutral-300 dark:bg-neutral-700">
          <Image
            src={images[activeIndex]}
            alt={`${title} - foto ${activeIndex + 1}`}
            fill
            unoptimized
            priority
            sizes="(min-width: 1024px) 42rem, 55vw"
            className="object-cover"
          />
        </div>
      </div>

      {/* Mobile: swipeable infinite carousel */}
      <div className="md:hidden">
        <div
          ref={trackRef}
          className="relative aspect-[3/4] touch-pan-y select-none overflow-hidden bg-neutral-300 dark:bg-neutral-700"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
        >
          <div
            className="flex h-full"
            style={{
              width: `${total * 100}%`,
              transform: `translateX(calc(${-activeIndex * (100 / total)}% + ${dragPercentOfTrack}%))`,
              transition: isDragging ? "none" : "transform 300ms ease-out",
            }}
          >
            {images.map((src, index) => (
              <div key={`${src}-${index}`} className="relative h-full" style={{ width: `${100 / total}%` }}>
                <Image
                  src={src}
                  alt={`${title} - foto ${index + 1}`}
                  fill
                  unoptimized
                  priority={index === 0}
                  sizes="100vw"
                  className="pointer-events-none object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {total > 1 && (
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Ir para a foto ${index + 1}`}
                aria-current={index === activeIndex}
                onClick={() => setActiveIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeIndex
                    ? "w-5 bg-neutral-900 dark:bg-neutral-100"
                    : "w-1.5 bg-neutral-300 dark:bg-neutral-700"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
