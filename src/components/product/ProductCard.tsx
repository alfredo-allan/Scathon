"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product } from "@/types";
import { useWishlist } from "@/hooks/useWishlist";
import { ColorSwatches } from "./ColorSwatches";
import { StarRating } from "./StarRating";
import { NotifyMeButton } from "./NotifyMeButton";

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
  const { isSaved, toggleSaved } = useWishlist();

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
  const isComingSoon = product.availability === "coming_soon";
  const isLiked = isSaved(product.id);

  return (
    // `h-full` + `flex-col` (the grid itself already stretches every card
    // to the tallest one in its row - CSS Grid's default `align-items:
    // stretch` - this just makes that stretch usable for layout) lets the
    // bottom block anchor with `mt-auto` below instead of drifting to
    // wherever the title/price happen to end. Titles differ a lot in
    // length across the catalog ("Calça de Moletom Cinza" vs "Bermuda de
    // Moletom Cinza" vs "Camiseta Cathedral Preta"), and without this the
    // CTA/rating row shifted up or down card by card, so buttons in the
    // same grid row visibly didn't line up.
    <div className="group relative flex h-full flex-col bg-neutral-100/50 dark:bg-neutral-900/50 p-4 rounded-none transition-colors">
      <Link
        href={productHref}
        className="relative block aspect-[3/4] overflow-hidden bg-neutral-300 dark:bg-neutral-700"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isComingSoon ? (
          <span className="absolute left-2 top-2 z-10 border border-neutral-900 bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-900 dark:border-neutral-100 dark:bg-neutral-950/90 dark:text-neutral-100">
            Em breve
          </span>
        ) : (
          product.isNew && (
            <span className="absolute left-2 top-2 z-10 bg-neutral-900 dark:bg-neutral-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-100 dark:text-neutral-900">
              Novo
            </span>
          )
        )}

        {/* "Curtir" the product photo - a lightweight, photo-first way to
            save something for later right from the grid, without leaving
            it or opening the detail page first. Writes to the same
            `useWishlist()` store the detail page's "Salvar como favoritos"
            button already uses, so a like here and a save there are the
            exact same list (see `/wishlist`, reachable from the header's
            heart icon). `preventDefault`+`stopPropagation` keep the click
            from also activating the surrounding <Link>'s navigation. */}
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleSaved(product.id);
          }}
          aria-pressed={isLiked}
          aria-label={isLiked ? "Remover dos curtidos" : "Curtir foto"}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-neutral-900 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white dark:bg-neutral-950/75 dark:text-neutral-100 dark:hover:bg-neutral-950"
        >
          {isLiked ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-red-500" fill="currentColor" aria-hidden>
              <path d="M11.645 20.91a.75.75 0 0 1-.704 0c-.22-.12-.402-.223-.552-.313a25.175 25.175 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17c-.15.09-.331.194-.552.313l-.001.001Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
              <path
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        <Image
          src={showSwap ? swapImage : baseImage}
          alt={`${product.title} — ${activeColor}`}
          fill
          unoptimized
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </Link>

      {/* Everything below the image is one flex column so the CTA/rating
          block at the bottom can anchor with `mt-auto` - see the doc
          comment on the outer card div. */}
      <div className="flex flex-1 flex-col">
        <Link href={productHref}>
          {/* `line-clamp-2` + a matching `min-h` reserve the same two-line
              slot whether a title is one line ("Moletom Básico Preto") or
              wraps to two ("Bermuda de Moletom Cinza") - otherwise a
              one-line title left everything under it sitting higher than
              its two-line neighbor in the same grid row. */}
          <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug tracking-tight text-neutral-900 dark:text-neutral-100">
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

        <div className="mt-auto">
          {isComingSoon ? (
            <NotifyMeButton productId={product.id} productTitle={product.title} size="sm" />
          ) : (
            <>
              <ColorSwatches
                colors={product.colors}
                activeColor={activeColor}
                onSelect={(color) => setActiveColor(color.name)}
              />

              <StarRating rating={product.rating} reviewCount={product.reviewCount} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
