import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/data/categories";
import { getProductBySlug, listProducts } from "@/lib/products";
import { ProductDetail } from "@/components/product/ProductDetail";

interface ProductPageParams {
  category: string;
  product: string;
}

// Sem `generateStaticParams()` - mesma razão de `/shop/[category]`: o
// catálogo agora vem do backend real (`@/lib/products`), então uma lista de
// slugs fixa no build ficaria desatualizada assim que um produto novo fosse
// cadastrado no painel admin. Cada produto é buscado sob demanda abaixo.
export async function generateMetadata({
  params,
}: {
  params: Promise<ProductPageParams>;
}): Promise<Metadata> {
  const { product: slug } = await params;
  const product = await getProductBySlug(slug);

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
  const product = await getProductBySlug(productSlug);

  // A valid product under the wrong category slug (typo'd or stale link)
  // 404s too, same as a completely unknown slug - the URL's category
  // segment is source of truth for where the product "lives", not just a
  // label.
  if (!category || !product || product.category !== category.id) {
    notFound();
  }

  // "Você também pode gostar" rail: same-category products first (most
  // relevant), padded out with anything else if the category is thin - caps
  // at 4 so it stays a quick horizontal glance, not another grid. Busca o
  // catálogo completo (revalidado a cada 60s) em vez de um array estático em
  // memória - mesma fonte de dados que todo o resto do catálogo agora usa.
  const allProducts = await listProducts({ revalidate: 60 });
  const sameCategory = allProducts.filter((p) => p.id !== product.id && p.category === product.category);
  const otherCategories = allProducts.filter((p) => p.id !== product.id && p.category !== product.category);
  const relatedProducts = [...sameCategory, ...otherCategories].slice(0, 4);

  return <ProductDetail product={product} category={category} relatedProducts={relatedProducts} />;
}
