import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/data/categories";
import { getProductBySlug, products } from "@/data/products";
import { ProductDetail } from "@/components/product/ProductDetail";

interface ProductPageParams {
  category: string;
  product: string;
}

// "Generate params from the bottom up" (per Next's own docs for routes with
// multiple dynamic segments): each product already knows its own category,
// so one pass over the catalog produces every valid {category, product}
// pair - there's no need for this segment to depend on the parent
// `/shop/[category]` page's own generateStaticParams.
export function generateStaticParams(): ProductPageParams[] {
  return products.map((product) => ({
    category: product.category,
    product: product.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<ProductPageParams>;
}): Promise<Metadata> {
  const { product: slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return { title: "Produto não encontrado — Scathon" };
  }

  return {
    title: `${product.title} — Scathon`,
    description: product.description?.split("\n\n")[0] ?? `${product.title} na Scathon.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<ProductPageParams>;
}) {
  const { category: categorySlug, product: productSlug } = await params;

  const category = getCategoryBySlug(categorySlug);
  const product = getProductBySlug(productSlug);

  // A valid product under the wrong category slug (typo'd or stale link)
  // 404s too, same as a completely unknown slug - the URL's category
  // segment is source of truth for where the product "lives", not just a
  // label.
  if (!category || !product || product.category !== category.id) {
    notFound();
  }

  // "Você também pode gostar" rail: same-category products first (most
  // relevant), padded out with anything else if the category is thin - caps
  // at 4 so it stays a quick horizontal glance, not another grid.
  const sameCategory = products.filter((p) => p.id !== product.id && p.category === product.category);
  const otherCategories = products.filter((p) => p.id !== product.id && p.category !== product.category);
  const relatedProducts = [...sameCategory, ...otherCategories].slice(0, 4);

  return <ProductDetail product={product} category={category} relatedProducts={relatedProducts} />;
}
