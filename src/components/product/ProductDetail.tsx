"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Category, Product } from "@/types";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { ProductGallery } from "./ProductGallery";
import { ShippingEstimator } from "./ShippingEstimator";

interface ProductDetailProps {
  product: Product;
  category: Category;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const NUMERIC_SIZE_CHART: Record<string, string> = {
  "38": "76",
  "40": "80",
  "42": "84",
  "44": "88",
  "46": "92",
};

const LETTER_SIZE_CHART: Record<string, { chest: string; length: string }> = {
  P: { chest: "96-101", length: "68" },
  M: { chest: "102-107", length: "70" },
  G: { chest: "108-113", length: "72" },
  GG: { chest: "114-119", length: "74" },
  XG: { chest: "120-125", length: "76" },
};

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
export function ProductDetail({ product, category }: ProductDetailProps) {
  const { addItem } = useCart();
  const { isSaved, toggleSaved } = useWishlist();

  const [activeColor, setActiveColor] = useState(product.colors[0]?.name ?? "");
  const [activeSize, setActiveSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);

  const activeColorVariant = useMemo(
    () => product.colors.find((color) => color.name === activeColor),
    [product.colors, activeColor],
  );

  const galleryImages = useMemo(() => {
    if (product.images && product.images.length > 0) return product.images;
    const fallback = [
      activeColorVariant?.imageUrl ?? product.imageUrl,
      product.imageUrl,
      product.hoverImageUrl,
    ].filter((src): src is string => Boolean(src));
    return Array.from(new Set(fallback));
  }, [product.images, product.imageUrl, product.hoverImageUrl, activeColorVariant]);

  const discountPercent = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : null;
  const installmentBase = product.compareAtPrice ?? product.price;
  const installmentValue = installmentBase / 10;

  const descriptionParagraphs = (
    product.description ??
    `${product.title} - streetwear Scathon feito pra durar. Confira as fotos e escolha sua cor e tamanho favoritos.`
  )
    .split("\n\n")
    .filter(Boolean);

  const hasSizes = Boolean(product.sizes && product.sizes.length > 0);
  const isNumericSizing = hasSizes && /^\d/.test(product.sizes![0]);

  function handleAddToCart() {
    if (hasSizes && !activeSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      imageUrl: activeColorVariant?.imageUrl ?? product.imageUrl,
      color: activeColor,
      size: activeSize ?? "Único",
    });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  }

  function handleShareToWhatsApp() {
    const url = window.location.href;
    const text = encodeURIComponent(`${product.title} - ${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.title, url });
      } catch {
        // Native share sheet dismissed - nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 2000);
    } catch {
      // Clipboard blocked/unavailable - no good fallback UI for this yet.
    }
  }

  const saved = isSaved(product.id);

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
          <li>
            <Link href={category.href} className="hover:text-neutral-900 dark:hover:text-neutral-100">
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
          <h1 className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50 md:text-2xl">
            {product.title}
          </h1>

          <button
            type="button"
            onClick={() => setReviewsOpen(true)}
            className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400"
          >
            <span aria-hidden className="flex text-neutral-900 dark:text-neutral-100">
              {Array.from({ length: 5 }, (_, index) => (
                <span key={index}>{index < Math.round(product.rating) ? "★" : "☆"}</span>
              ))}
            </span>
            {product.rating.toFixed(1)} · {product.reviewCount} avaliações
          </button>

          <div className="mt-4 flex flex-wrap items-baseline gap-2">
            <span className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
              {currencyFormatter.format(product.price)}
            </span>
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

          {product.colors.length > 1 && (
            <div className="mt-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                Cores e modelos
              </span>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.colors.map((color) => {
                  const isActive = color.name === activeColor;
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setActiveColor(color.name)}
                      aria-pressed={isActive}
                      title={color.name}
                      className={`relative h-16 w-16 shrink-0 overflow-hidden border transition-colors ${
                        isActive
                          ? "border-neutral-950 dark:border-neutral-100"
                          : "border-neutral-200 dark:border-neutral-800"
                      }`}
                    >
                      <Image
                        src={color.imageUrl}
                        alt={color.name}
                        fill
                        unoptimized
                        sizes="64px"
                        className="object-cover"
                      />
                    </button>
                  );
                })}
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
                  className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
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
                          <td className="py-1.5">{NUMERIC_SIZE_CHART[size] ?? "—"}</td>
                        ) : (
                          <>
                            <td className="py-1.5">{LETTER_SIZE_CHART[size]?.chest ?? "—"}</td>
                            <td className="py-1.5">{LETTER_SIZE_CHART[size]?.length ?? "—"}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes!.map((size) => {
                  const isActive = size === activeSize;
                  return (
                    <button
                      key={size}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        setActiveSize(size);
                        setSizeError(false);
                      }}
                      className={`h-11 min-w-11 border px-3 text-sm transition-colors ${
                        isActive
                          ? "border-neutral-950 bg-neutral-950 text-neutral-50 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950"
                          : "border-neutral-300 text-neutral-800 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
              {sizeError && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                  Escolha um tamanho antes de adicionar ao carrinho.
                </p>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full bg-neutral-950 py-3.5 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
            >
              {addedFeedback ? "Adicionado ao carrinho ✓" : "Adicionar ao carrinho"}
            </button>

            <button
              type="button"
              onClick={() => toggleSaved(product.id)}
              aria-pressed={saved}
              className="flex w-full items-center justify-center gap-2 border border-neutral-300 py-3.5 text-xs font-semibold uppercase tracking-widest text-neutral-900 transition-colors hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
            >
              {saved ? "Salvo nos favoritos" : "Salvar como favoritos"}
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill={saved ? "currentColor" : "none"}
                aria-hidden
              >
                <path
                  d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5 6 5c2 0 3.5 1.2 4 2.5C10.5 6.2 12 5 14 5c3.5 0 5 3.5 3.5 6.5C19 15.65 12 20 12 20Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
            <span>Compartilhar:</span>
            <button
              type="button"
              onClick={handleShareToWhatsApp}
              className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.2c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.7-.3-1.4-.7-2-1.3-.5-.5-1-1.1-1.4-1.7-.1-.2 0-.4.1-.5l.4-.5c.1-.2.1-.3.2-.5.1-.2 0-.4 0-.5l-.7-1.7c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.7.7-1 1.5-1 2.4.1 1.1.5 2.1 1.2 3 1 1.5 2.3 2.7 3.9 3.5.5.2.9.4 1.4.5.6.2 1.2.2 1.8.1.6-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.2-.4-.3Z" />
              </svg>
              WhatsApp
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                <rect x="9" y="9" width="11" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6 15H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              {shareFeedback ? "Link copiado!" : "Copiar link"}
            </button>
          </div>

          <ShippingEstimator />

          <div className="border-t border-neutral-200 dark:border-neutral-800 py-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
              Descrição
            </h2>
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
                className="mt-3 text-xs font-semibold uppercase tracking-widest text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
              >
                Ver mais detalhes do produto
              </button>
            )}

            <ul className="mt-4 flex flex-col gap-1 text-sm text-neutral-600 dark:text-neutral-400">
              <li>Cor: {activeColor}</li>
              {product.styleCode && <li>Estilo: {product.styleCode}</li>}
            </ul>
          </div>

          <div className="border-t border-neutral-200 dark:border-neutral-800 py-6">
            <button
              type="button"
              onClick={() => setReviewsOpen((current) => !current)}
              aria-expanded={reviewsOpen}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="text-sm font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                Avaliações ({product.reviewCount})
              </span>
              <span className="flex items-center gap-2">
                <span aria-hidden className="flex text-neutral-900 dark:text-neutral-100">
                  {Array.from({ length: 5 }, (_, index) => (
                    <span key={index}>{index < Math.round(product.rating) ? "★" : "☆"}</span>
                  ))}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  className={`h-3.5 w-3.5 text-neutral-500 transition-transform ${reviewsOpen ? "rotate-180" : ""}`}
                  fill="none"
                  aria-hidden
                >
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
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {review.author}
                        </span>
                        <span aria-hidden className="flex text-xs text-neutral-900 dark:text-neutral-100">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i}>{i < review.rating ? "★" : "☆"}</span>
                          ))}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Ainda não há avaliações detalhadas por escrito para este produto - a nota acima é a
                    média agregada de {product.reviewCount} compras.
                  </p>
                )}
              </div>
            )}
          </div>

          <Link
            href="/support/contact"
            className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            Relatar problema
          </Link>
        </div>
      </div>
    </div>
  );
}
