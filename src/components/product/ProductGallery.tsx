"use client";

import Image from "next/image";

interface ProductGalleryProps {
  images: string[];
  title: string;
}

/**
 * The product detail page's photo grid - a plain two-column tile grid on
 * every breakpoint (mobile included), matching the reference screenshot's
 * gallery rather than a single hero image + thumbnail rail. There's no
 * lightbox/zoom here; each tile is just a full-bleed `object-cover` photo,
 * same visual language as `<ProductCard/>`'s own image treatment.
 *
 * `images` is whatever `<ProductDetail/>` resolved (either the product's
 * own `images` array, or the derived fallback - see that component) - this
 * component doesn't know or care which case it's in.
 */
export function ProductGallery({ images, title }: ProductGalleryProps) {
  const isOdd = images.length % 2 === 1;

  return (
    <div className="grid grid-cols-2 gap-2 md:gap-3">
      {images.map((src, index) => {
        const isLast = index === images.length - 1;
        return (
          <div
            key={`${src}-${index}`}
            className={`relative aspect-[3/4] overflow-hidden bg-neutral-100 dark:bg-neutral-900 ${
              isOdd && isLast ? "col-span-2" : ""
            }`}
          >
            <Image
              src={src}
              alt={`${title} - foto ${index + 1}`}
              fill
              unoptimized
              priority={index === 0}
              sizes="(min-width: 1024px) 33vw, 50vw"
              className="object-cover"
            />
          </div>
        );
      })}
    </div>
  );
}
