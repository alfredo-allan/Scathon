"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getProductsByIds } from "@/lib/products";
import { useWishlist } from "@/hooks/useWishlist";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types";

/**
 * `/wishlist` page body - a lista de produtos que o cliente curtiu (via o
 * coração na foto do `<ProductCard/>`, ou "Salvar como favoritos" na página
 * de detalhe; ambos escrevem no mesmo `useWishlist()`, então esta página é o
 * único lugar pra onde os dois levam de volta).
 *
 * `savedIds` continua vindo de `useWishlist()` (os ids em si ainda são só do
 * navegador - não há endpoint de "favoritos" no backend), mas resolver
 * esses ids em produtos de verdade agora é assíncrono (`getProductsByIds` -
 * ver `@/lib/products`), já que o catálogo em si vem do backend real, não
 * mais do array estático em `@/data/products`.
 */
export function WishlistView() {
  const { savedIds } = useWishlist();
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (savedIds.length === 0) {
      setSavedProducts([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      setSavedProducts(await getProductsByIds(savedIds));
    } finally {
      setIsLoading(false);
    }
  }, [savedIds]);

  useEffect(() => {
    // Mesmo idioma de `<AccountOrdersView/>`'s `loadOrders` - adia a
    // primeira chamada pra fora da passada síncrona do efeito
    // (`react-hooks/set-state-in-effect`).
    Promise.resolve().then(() => load());
  }, [load]);

  return (
    <div className="px-4 md:px-8 py-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Página Inicial
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-neutral-900 dark:text-neutral-100">Curtidos</li>
        </ol>
      </nav>

      <h1 className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50 md:text-2xl">
        Curtidos <span className="text-base font-normal text-neutral-500 dark:text-neutral-400">({savedProducts.length})</span>
      </h1>

      {isLoading ? (
        <p className="mt-8 text-sm text-neutral-500 dark:text-neutral-400">Carregando curtidos…</p>
      ) : savedProducts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Você ainda não curtiu nenhum produto. Toque no coração de uma foto pra guardar aqui.
          </p>
          {/* No all-products "/shop" listing yet - home's "Todos os
              Produtos" grid covers the same job for now (see
              `@/data/categories`'s doc comment). */}
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-widest text-neutral-900 underline underline-offset-4 dark:text-neutral-100">
            Ver produtos
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {savedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
