"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product } from "@/types";
import { ColorSwatches } from "./ColorSwatches";
import { StarRating } from "./StarRating";

interface ProductCardProps {
  product: Product;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function ProductCard({ product }: ProductCardProps) {
  const [activeColor, setActiveColor] = useState(product.colors[0]?.name ?? "");
  const [isHovered, setIsHovered] = useState(false);

  const activeVariant = useMemo(
    () => product.colors.find((color) => color.name === activeColor),
    [product.colors, activeColor],
  );

  // Real photography (`coverImage`) wins over the legacy placeholder
  // `imageUrl` once a product sets it - see the doc comment on
  // `Product.coverImage`. `activeVariant` (a picked color swatch) still
  // wins over both, so a placeholder product's color-swap behavior is
  // unaffected.
  const baseImage = activeVariant?.imageUrl ?? product.coverImage ?? product.imageUrl;
  const swapImage = product.hoverImageUrl ?? baseImage;
  const showSwap = isHovered && !activeVariant;
  const productHref = `/shop/${product.category}/${product.slug}`;

  return (
    <div className="group relative flex flex-col bg-neutral-100/50 dark:bg-neutral-900/50 p-4 rounded-none transition-colors">
      <Link
        href={productHref}
        className="relative block aspect-[3/4] overflow-hidden bg-neutral-200 dark:bg-neutral-800"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {product.isNew && (
          <span className="absolute left-2 top-2 z-10 bg-neutral-900 dark:bg-neutral-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-100 dark:text-neutral-900">
            Novo
          </span>
        )}
        <Image
          src={showSwap ? swapImage : baseImage}
          alt={`${product.title} — ${activeColor}`}
          fill
          unoptimized
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </Link>

      <Link href={productHref}>
        <p className="text-sm font-medium tracking-tight mt-3 text-neutral-900 dark:text-neutral-100">
          {product.title}
        </p>
      </Link>

      <div className="mt-1 flex items-baseline gap-2 text-sm">
        <span className="font-medium text-neutral-900 dark:text-neutral-100">
          {currencyFormatter.format(product.price)}
        </span>
        {product.compareAtPrice && (
          <span className="text-neutral-500 dark:text-neutral-500 line-through">
            {currencyFormatter.format(product.compareAtPrice)}
          </span>
        )}
      </div>

      <ColorSwatches
        colors={product.colors}
        activeColor={activeColor}
        onSelect={(color) => setActiveColor(color.name)}
      />

      <StarRating rating={product.rating} reviewCount={product.reviewCount} />
    </div>
  );
}
