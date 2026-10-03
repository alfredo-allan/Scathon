import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/data/categories";
import { getProductsByCategory } from "@/lib/products";
import { CategoryListing } from "@/components/category/CategoryListing";

interface CategoryPageParams {
  category: string;
}

// Sem `generateStaticParams()` - o catálogo real (`@/lib/products`) muda
// conforme o painel admin cadastra/edita produtos, então cada categoria é
// renderizada sob demanda (Server Component assíncrono abaixo) em vez de
// pré-gerada no build com uma lista de slugs fixa. `getProductsByCategory`
// revalida a cada 60s, então um ajuste no admin ainda aparece rápido sem
// precisar de um novo deploy.
export async function generateMetadata({
  params,
}: {
  params: Promise<CategoryPageParams>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return { title: "Categoria não encontrada — Scathon" };
  }

  return {
    title: `${category.label} — Scathon`,
    description: `Confira a coleção de ${category.label.toLowerCase()} da Scathon.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<CategoryPageParams>;
}) {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const products = await getProductsByCategory(category.id, 60);

  return <CategoryListing category={category} products={products} />;
}
