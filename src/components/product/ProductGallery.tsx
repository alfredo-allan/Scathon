"use client";

import Image from "next/image";

interface ProductGalleryProps {
  images: string[];
  title: string;
}

/**
 * Product photo gallery for the PDP. A usability pass dropped the old
 * "one large focused photo + a row of smaller thumbnail cards below it"
 * layout - every photo now renders at that same large size, stacked
 * vertically, with no separate thumbnail strip and no click-to-swap state
 * to manage.
 *
 * Desktop/tablet (`lg`+ - matching this app's other desktop-only
 * responsiveness passes): the whole gallery becomes its own
 * independently-scrollable, viewport-pinned pane - `lg:sticky lg:top-6`
 * (same offset `<ProductDetail/>`'s buy-box column already uses, so both
 * columns' tops line up) plus a bounded `lg:max-h-[...]` and
 * `lg:overflow-y-auto`. Scrolling with the cursor over the photos scrolls
 * through *them* first; once the gallery's own scroll bottoms out, the
 * browser's native scroll-chaining hands the rest of the gesture to the
 * page itself - that handoff needs no JS, it's just what a bounded
 * `overflow: auto` box inside a `position: sticky` parent already does.
 * `no-scrollbar` (the same utility `<Header/>`'s category nav and
 * `<CategoryBar/>` already rely on) hides the scrollbar chrome without
 * disabling the scroll it drives.
 *
 * Mobile/`md`-down: none of the above applies - no sticky, no bounded
 * height, no internal scroll. Photos are just stacked in normal page
 * flow, exactly like everything else on the page.
 */
export function ProductGallery({ images, title }: ProductGalleryProps) {
  return (
    <div className="no-scrollbar lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
      <div className="mx-auto flex max-w-xl flex-col gap-3 md:max-w-2xl">
        {images.map((src, index) => (
          <div
            key={`${src}-${index}`}
            className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-300 dark:bg-neutral-700"
          >
            <Image
              src={src}
              alt={`${title} - foto ${index + 1}`}
              fill
              unoptimized
              priority={index === 0}
              sizes="(min-width: 1024px) 42rem, 100vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
