'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { Category, Product } from '@/types'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'
import { ProductGallery } from './ProductGallery'
import { ShippingEstimator } from './ShippingEstimator'
import { NotifyMeButton } from './NotifyMeButton'

interface ProductDetailProps {
  product: Product
  category: Category
  /** Cross-sell rail shown where a per-product color picker used to be -
   * see the comment above that section for why. */
  relatedProducts: Product[]
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
})

const NUMERIC_SIZE_CHART: Record<string, string> = {
  '38': '76',
  '40': '80',
  '42': '84',
  '44': '88',
  '46': '92'
}

const LETTER_SIZE_CHART: Record<string, { chest: string; length: string }> = {
  P: { chest: '96-101', length: '68' },
  M: { chest: '102-107', length: '70' },
  G: { chest: '108-113', length: '72' },
  GG: { chest: '114-119', length: '74' },
  XG: { chest: '120-125', length: '76' }
}

/**
 * The `/shop/[category]/[product]` page body: image gallery + buy box,
 * modeled on the reference Nike PDP screenshots but restyled in Scathon's
 * own flat/monochrome identity (rectangular buttons, uppercase
 * tracking-widest labels, no rounded pills or brand green) - and trimmed to
 * mechanics this store actually has. Two things from the reference were
 * deliberately left out rather than faked: the "baixe o app" promo banner
 * (Scathon doesn't have an app) and per-size stock (`sizes` just lists what
 * exists, nothing is shown as sold out, since there's no inventory count to
 * back that up).
 */
export function ProductDetail({ product, category, relatedProducts }: ProductDetailProps) {
  const { addItem } = useCart()
  const { isSaved, toggleSaved } = useWishlist()

  // Color is no longer a pickable variant here - this catalog's only real
  // per-product variety is size. `colors[0]` is kept as the product's
  // informational/default color (shown in the spec list below), and the
  // slot that used to hold a color-swatch picker now shows other products
  // instead (see the "Você também pode gostar" section).
  const defaultColor = product.colors[0]

  const [activeSize, setActiveSize] = useState<string | null>(null)
  const [sizeError, setSizeError] = useState(false)
  const [addedFeedback, setAddedFeedback] = useState(false)
  const [shareFeedback, setShareFeedback] = useState(false)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)
  const [reviewsOpen, setReviewsOpen] = useState(false)

  const galleryImages = useMemo(() => {
    // Real photography wins: `specimenImages` (model photos) first, then
    // the older placeholder-era `images` gallery, then a small fallback
    // built from whatever single photos the product does have.
    if (product.specimenImages && product.specimenImages.length > 0) return product.specimenImages
    if (product.images && product.images.length > 0) return product.images
    const fallback = [product.coverImage ?? defaultColor?.imageUrl ?? product.imageUrl, product.imageUrl, product.hoverImageUrl].filter(
      (src): src is string => Boolean(src)
    )
    return Array.from(new Set(fallback))
  }, [product.specimenImages, product.images, product.coverImage, product.imageUrl, product.hoverImageUrl, defaultColor])

  const discountPercent = product.compareAtPrice ? Math.round((1 - product.price / product.compareAtPrice) * 100) : null
  const installmentBase = product.compareAtPrice ?? product.price
  const installmentValue = installmentBase / 10

  const descriptionParagraphs = (
    product.description ?? `${product.title} - streetwear Scathon feito pra durar. Confira as fotos e escolha seu tamanho.`
  )
    .split('\n\n')
    .filter(Boolean)

  const hasSizes = Boolean(product.sizes && product.sizes.length > 0)
  const isNumericSizing = hasSizes && /^\d/.test(product.sizes![0])

  function handleAddToCart() {
    if (hasSizes && !activeSize) {
      setSizeError(true)
      return
    }
    setSizeError(false)
    addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      imageUrl: product.coverImage ?? defaultColor?.imageUrl ?? product.imageUrl,
      color: defaultColor?.name ?? '',
      size: activeSize ?? 'Único'
    })
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 2000)
  }

  function handleShareToWhatsApp() {
    const url = window.location.href
    const text = encodeURIComponent(`${product.title} - ${url}`)
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: product.title, url })
      } catch {
        // Native share sheet dismissed - nothing to do.
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setShareFeedback(true)
      setTimeout(() => setShareFeedback(false), 2000)
    } catch {
      // Clipboard blocked/unavailable - no good fallback UI for this yet.
    }
  }

  const saved = isSaved(product.id)
  const isComingSoon = product.availability === 'coming_soon'

  return (
    <div className="px-4 md:px-8 py-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-neutral-500 dark:text-neutral-400 hidden">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-neutral-900 dark:hover:text-neutral-100 hidden">
              Página Inicial
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={category.href} className="hover:text-neutral-900 dark:hover:text-neutral-100 hidden">
              {category.label}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-neutral-900 dark:text-neutral-100">{product.title}</li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
        <div>
          <ProductGallery images={galleryImages} title={product.title} />
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50 md:text-2xl">{product.title}</h1>

          {isComingSoon ? (
            <span className="mt-1.5 inline-block border border-neutral-300 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
              Em breve
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setReviewsOpen(true)}
              className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
              <span aria-hidden className="flex text-neutral-900 dark:text-neutral-100">
                {Array.from({ length: 5 }, (_, index) => (
                  <span key={index}>{index < Math.round(product.rating) ? '★' : '☆'}</span>
                ))}
              </span>
              {product.rating.toFixed(1)} · {product.reviewCount} avaliações
            </button>
          )}

          <div className="mt-4 flex flex-wrap items-baseline gap-2">
            <span className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">{currencyFormatter.format(product.price)}</span>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">no Pix</span>
            {product.compareAtPrice && (
              <>
                <span className="text-sm text-neutral-400 line-through dark:text-neutral-600">
                  {currencyFormatter.format(product.compareAtPrice)}
                </span>
                {discountPercent !== null && discountPercent > 0 && (
                  <span className="bg-neutral-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-50 dark:bg-neutral-100 dark:text-neutral-950">
                    -{discountPercent}%
                  </span>
                )}
              </>
            )}
          </div>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            ou 10x de {currencyFormatter.format(installmentValue)} sem juros
          </p>

          {relatedProducts.length > 0 && (
            <div className="mt-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                Você também pode gostar
              </span>
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                {relatedProducts.map((related) => (
                  <Link
                    key={related.id}
                    href={`/shop/${related.category}/${related.slug}`}
                    title={related.title}
                    className="group w-16 shrink-0 lg:w-20">
                    <div className="relative aspect-[3/4] overflow-hidden bg-neutral-300 dark:bg-neutral-700">
                      <Image
                        src={related.coverImage ?? related.imageUrl}
                        alt={related.title}
                        fill
                        unoptimized
                        sizes="80px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-tight text-neutral-600 dark:text-neutral-400">{related.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {hasSizes && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                  Tamanho e numeração
                </span>
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen((current) => !current)}
                  className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
                  Tabela de medidas
                </button>
              </div>

              {sizeGuideOpen && (
                <table className="mt-3 w-full border-collapse text-left text-xs text-neutral-600 dark:text-neutral-400">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                      <th className="py-1.5 font-medium">Tamanho</th>
                      {isNumericSizing ? (
                        <th className="py-1.5 font-medium">Cintura (cm)</th>
                      ) : (
                        <>
                          <th className="py-1.5 font-medium">Peito (cm)</th>
                          <th className="py-1.5 font-medium">Comprimento (cm)</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {product.sizes!.map((size) => (
                      <tr key={size} className="border-b border-neutral-100 dark:border-neutral-900">
                        <td className="py-1.5">{size}</td>
                        {isNumericSizing ? (
                          <td className="py-1.5">{NUMERIC_SIZE_CHART[size] ?? '—'}</td>
                        ) : (
                          <>
                            <td className="py-1.5">{LETTER_SIZE_CHART[size]?.chest ?? '—'}</td>
                            <td className="py-1.5">{LETTER_SIZE_CHART[size]?.length ?? '—'}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes!.map((size) => {
                  const isActive = size === activeSize
                  return (
                    <button
                      key={size}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        setActiveSize(size)
                        setSizeError(false)
                      }}
                      className={`h-11 min-w-11 border px-3 text-sm transition-colors ${
                        isActive
                          ? 'border-neutral-950 bg-neutral-950 text-neutral-50 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950'
                          : 'border-neutral-300 text-neutral-800 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500'
                      }`}>
                      {size}
                    </button>
                  )
                })}
              </div>
              {sizeError && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">Escolha um tamanho antes de adicionar ao carrinho.</p>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            {isComingSoon ? (
              <NotifyMeButton productId={product.id} productTitle={product.title} size="lg" selectedSize={activeSize} defaultOpen />
            ) : (
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full bg-neutral-950 py-3.5 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950">
                {addedFeedback ? 'Adicionado ao carrinho ✓' : 'Adicionar ao carrinho'}
              </button>
            )}

            <button
              type="button"
              onClick={() => toggleSaved(product.id)}
              aria-pressed={saved}
              className="flex w-full items-center justify-center gap-2 border border-neutral-300 py-3.5 text-xs font-semibold uppercase tracking-widest text-neutral-900 transition-colors hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500">
              {saved ? 'Salvo nos favoritos' : 'Salvar como favoritos'}
              {saved ? (
                // Filled heart - a well-tested, symmetric path (the earlier
                // hand-drawn one rendered visibly lopsided/warped).
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden>
                  <path d="M11.645 20.91a.75.75 0 0 1-.704 0c-.22-.12-.402-.223-.552-.313a25.175 25.175 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17c-.15.09-.331.194-.552.313l-.001.001Z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" aria-hidden>
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
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
            <span>Compartilhar:</span>
            <button
              type="button"
              onClick={handleShareToWhatsApp}
              className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-neutral-100">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.2c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.7-.3-1.4-.7-2-1.3-.5-.5-1-1.1-1.4-1.7-.1-.2 0-.4.1-.5l.4-.5c.1-.2.1-.3.2-.5.1-.2 0-.4 0-.5l-.7-1.7c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.7.7-1 1.5-1 2.4.1 1.1.5 2.1 1.2 3 1 1.5 2.3 2.7 3.9 3.5.5.2.9.4 1.4.5.6.2 1.2.2 1.8.1.6-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.2-.4-.3Z" />
              </svg>
              WhatsApp
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-neutral-100">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                <rect x="9" y="9" width="11" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6 15H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              {shareFeedback ? 'Link copiado!' : 'Copiar link'}
            </button>
          </div>

          {!isComingSoon && <ShippingEstimator />}

          <div className="border-t border-neutral-200 dark:border-neutral-800 py-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">Descrição</h2>
            <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              <p className="whitespace-pre-line">{descriptionParagraphs[0]}</p>
              {descriptionExpanded &&
                descriptionParagraphs.slice(1).map((paragraph, index) => (
                  <p key={index} className="whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
            </div>

            {descriptionParagraphs.length > 1 && !descriptionExpanded && (
              <button
                type="button"
                onClick={() => setDescriptionExpanded(true)}
                className="mt-3 text-xs font-semibold uppercase tracking-widest text-neutral-900 underline underline-offset-4 dark:text-neutral-100">
                Ver mais detalhes do produto
              </button>
            )}

            <ul className="mt-4 flex flex-col gap-1 text-sm text-neutral-600 dark:text-neutral-400">
              {defaultColor && <li>Cor: {defaultColor.name}</li>}
              {product.styleCode && <li>Estilo: {product.styleCode}</li>}
            </ul>
          </div>

          {!isComingSoon && (
            <div className="border-t border-neutral-200 dark:border-neutral-800 py-6">
              <button
                type="button"
                onClick={() => setReviewsOpen((current) => !current)}
                aria-expanded={reviewsOpen}
                className="flex w-full items-center justify-between text-left">
                <span className="text-sm font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                  Avaliações ({product.reviewCount})
                </span>
                <span className="flex items-center gap-2">
                  <span aria-hidden className="flex text-neutral-900 dark:text-neutral-100">
                    {Array.from({ length: 5 }, (_, index) => (
                      <span key={index}>{index < Math.round(product.rating) ? '★' : '☆'}</span>
                    ))}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-3.5 w-3.5 text-neutral-500 transition-transform ${reviewsOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    aria-hidden>
                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>

              {reviewsOpen && (
                <div className="mt-4 flex flex-col gap-4">
                  {product.reviews && product.reviews.length > 0 ? (
                    product.reviews.map((review, index) => (
                      <div key={index} className="border-b border-neutral-100 pb-4 last:border-none dark:border-neutral-900">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{review.author}</span>
                          <span aria-hidden className="flex text-xs text-neutral-900 dark:text-neutral-100">
                            {Array.from({ length: 5 }, (_, i) => (
                              <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                            ))}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{review.comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Ainda não há avaliações detalhadas por escrito para este produto - a nota acima é a média agregada de{' '}
                      {product.reviewCount} compras.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* No support/contact page yet - points home rather than 404ing
              (same fix as the rest of the site's still-missing pages; see
              `@/data/categories`'s doc comment). */}
          <Link
            href="/"
            className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
            Relatar problema
          </Link>
        </div>
      </div>
    </div>
  )
}
