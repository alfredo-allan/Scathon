'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { getProductById } from '@/data/products'
import { useWishlist } from '@/hooks/useWishlist'
import { ProductCard } from '@/components/product/ProductCard'

/**
 * `/wishlist` page body - just the list of products the customer curtiu
 * (via the heart on `<ProductCard/>`'s photo or "Salvar como favoritos" on
 * the detail page; both write to the same `useWishlist()` store, so this
 * page is the single place either one leads back to).
 */
export function WishlistView() {
  const { savedIds } = useWishlist()

  const savedProducts = useMemo(() => savedIds.map((id) => getProductById(id)).filter((product) => product !== undefined), [savedIds])

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

      {savedProducts.length === 0 ? (
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
  )
}
