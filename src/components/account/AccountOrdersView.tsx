'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import { products } from '@/data/products'
import { getRecentOrders, type Order } from '@/lib/orders'
import { ProductCard } from '@/components/product/ProductCard'
import { OrderReviewForm } from './OrderReviewForm'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric'
})

const STATUS_LABEL: Record<Order['status'], string> = {
  processando: 'Processando',
  'a caminho': 'A caminho',
  entregue: 'Entregue'
}

const STATUS_STYLE: Record<Order['status'], string> = {
  processando: 'border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400',
  'a caminho': 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100',
  entregue: 'border-neutral-300 bg-neutral-900 text-neutral-50 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950'
}

/**
 * `/account/orders` page body: a modest read of the customer's own recent
 * purchase history (see `@/lib/orders` for why this is mock data - there's
 * no checkout/order backend yet), a spot to rate a product straight from
 * the order that bought it (`<OrderReviewForm/>`), and a light carousel of
 * newer products to come back for. Deliberately kept simple ("iteração
 * modesta") rather than a full account dashboard - orders, review, browse
 * more, in that order, on one page.
 */
export function AccountOrdersView() {
  const orders = useMemo(() => getRecentOrders(), [])
  // "Novos produtos" here means "stuff this customer hasn't bought yet"
  // rather than the catalog's `isNew` flag - with only two SKUs actually
  // purchasable today (the rest are `coming_soon`), filtering by `isNew`
  // alone would just echo back the same products already sitting in the
  // order history above. This also doubles as a nudge toward the
  // waitlist-only pieces, which is exactly what belongs in front of a
  // customer who already bought something.
  const suggestions = useMemo(() => {
    const orderedSlugs = new Set(orders.flatMap((order) => order.items.map((item) => item.slug)))
    return products.filter((product) => !orderedSlugs.has(product.slug))
  }, [orders])

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
          <li className="text-neutral-900 dark:text-neutral-100">Meus Pedidos</li>
        </ol>
      </nav>

      <h1 className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50 md:text-2xl">Meus Pedidos</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Você ainda não fez nenhum pedido.</p>
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
        <div className="mt-6 flex flex-col gap-6">
          {orders.map((order) => (
            <div key={order.id} className="border border-neutral-200 dark:border-neutral-800">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                    Pedido {order.id}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{dateFormatter.format(new Date(order.placedAt))}</p>
                </div>
                <span className={`border px-2 py-1 text-[10px] font-semibold uppercase tracking-widest ${STATUS_STYLE[order.status]}`}>
                  {STATUS_LABEL[order.status]}
                </span>
              </div>

              <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-900">
                {order.items.map((item, index) => (
                  <div key={`${order.id}-${index}`} className="flex gap-3 px-4 py-4">
                    <Link
                      href={`/shop/${item.category}/${item.slug}`}
                      className="relative block h-20 w-16 shrink-0 overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                      <Image src={item.imageUrl} alt={item.title} fill unoptimized sizes="64px" className="object-cover" />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/shop/${item.category}/${item.slug}`}
                        className="text-sm font-medium text-neutral-900 hover:underline dark:text-neutral-100">
                        {item.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                        Cor: {item.color} · Tam: {item.size}
                        {item.quantity > 1 ? ` · Qtd: ${item.quantity}` : ''}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-neutral-900 dark:text-neutral-100">
                        {currencyFormatter.format(item.price * item.quantity)}
                      </p>

                      {order.status === 'entregue' && <OrderReviewForm slug={item.slug} title={item.title} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">Novidades pra você</h2>
          <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-2">
            {suggestions.map((product) => (
              <div key={product.id} className="w-40 shrink-0 snap-start sm:w-48">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
