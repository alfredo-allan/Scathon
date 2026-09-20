"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { popularCategories } from "@/data/categories";
import { products } from "@/data/products";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Full-viewport search modal. Input is debounced before "querying"
 * (client-side filtering here; swap for a backend API call) to avoid
 * spamming the network on every keystroke.
 */
export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const results = useMemo(() => {
    const term = debouncedQuery.trim().toLowerCase();
    if (!term) return [];
    return products
      .filter((product) => product.title.toLowerCase().includes(term))
      .slice(0, 6);
  }, [debouncedQuery]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Buscar"
      className="fixed inset-0 z-50 bg-white dark:bg-neutral-900 p-4 sm:p-6 overflow-y-auto animate-slide-down"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 sm:gap-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-neutral-400" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar produtos..."
            className="flex-1 border-b border-neutral-300 dark:border-neutral-700 bg-transparent py-2 text-lg outline-none placeholder:text-neutral-400"
          />
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fechar busca"
            className="p-1 text-neutral-600 dark:text-neutral-400"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {debouncedQuery.trim() === "" ? (
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-3">
                Categorias populares
              </h3>
              <div className="flex flex-wrap gap-2">
                {popularCategories.map((category) => (
                  <Link
                    key={category.id}
                    href={category.href}
                    onClick={handleClose}
                    className="border border-neutral-200 dark:border-neutral-800 px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    {category.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-3">
                Recomendados
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {products.slice(0, 3).map((product) => (
                  <Link
                    key={product.id}
                    href={`/shop/${product.category}/${product.slug}`}
                    onClick={handleClose}
                    className="group"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                      <Image
                        src={product.imageUrl}
                        alt={product.title}
                        fill
                        unoptimized
                        sizes="33vw"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <p className="mt-2 text-sm">{product.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-3">
              {results.length > 0
                ? `${results.length} resultado(s) para "${debouncedQuery}"`
                : `Nenhum resultado para "${debouncedQuery}"`}
            </h3>
            <ul className="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800">
              {results.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/shop/${product.category}/${product.slug}`}
                    onClick={handleClose}
                    className="flex items-center gap-4 py-3"
                  >
                    <div className="relative h-16 w-12 shrink-0 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                      <Image
                        src={product.imageUrl}
                        alt={product.title}
                        fill
                        unoptimized
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <span className="text-sm">{product.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
