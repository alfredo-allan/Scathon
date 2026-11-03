import type { Category } from "@/types";
import { apiFetch } from "./apiClient";

interface CategoriesResponse {
  items: Array<{ id: string; label: string }>;
}

function mapCategory(category: { id: string; label: string }): Category {
  return {
    id: category.id,
    label: category.label,
    href: `/shop/${category.id}`,
  };
}

/** Public category source of truth used by storefront category routes. */
export async function listPublicCategories(revalidate?: number | false): Promise<Category[]> {
  const data = await apiFetch<CategoriesResponse>("/categories", { revalidate });
  return data.items.map(mapCategory);
}

export async function getPublicCategoryBySlug(
  slug: string,
  revalidate?: number | false,
): Promise<Category | undefined> {
  const categories = await listPublicCategories(revalidate);
  return categories.find((category) => category.id === slug);
}
