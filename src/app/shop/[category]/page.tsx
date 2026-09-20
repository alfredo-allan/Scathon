import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, popularCategories } from "@/data/categories";
import { getProductsByCategory } from "@/data/products";
import { CategoryListing } from "@/components/category/CategoryListing";

interface CategoryPageParams {
  category: string;
}

// Pre-render all five known category slugs at build time (Moletons,
// Camisetas, Casacos, Calças, Acessórios) - see `popularCategories` in
// @/data/categories, whose `id` doubles as this URL segment.
export function generateStaticParams(): CategoryPageParams[] {
  return popularCategories.map((category) => ({ category: category.id }));
}

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

  const products = getProductsByCategory(category.id);

  return <CategoryListing category={category} products={products} />;
}
