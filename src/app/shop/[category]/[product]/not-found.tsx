import Link from "next/link";
import { popularCategories } from "@/data/categories";

/**
 * Branded 404 for an unknown (or mismatched-category) `/shop/[category]/
 * [product]` slug. `not-found.js` files don't receive props (see Next's own
 * docs), so this can't link back to "the" category the visitor came from -
 * it offers the full category list instead, same as the parent
 * `/shop/[category]/not-found.tsx`.
 */
export default function ProductNotFound() {
  return (
    <div className="flex flex-col items-center gap-6 px-4 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
        Produto não encontrado
      </p>
      <h1 className="max-w-md text-2xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
        Não encontramos esse produto.
      </h1>
      <p className="max-w-sm text-sm text-neutral-600 dark:text-neutral-400">
        O link pode estar incorreto ou o produto saiu de linha. Explore as
        categorias abaixo:
      </p>

      <ul className="flex flex-wrap justify-center gap-2">
        {popularCategories.map((category) => (
          <li key={category.id}>
            <Link
              href={category.href}
              className="border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-xs font-medium uppercase tracking-widest text-neutral-800 dark:text-neutral-100 transition-colors hover:border-neutral-500 dark:hover:border-neutral-500"
            >
              {category.label}
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/"
        className="mt-2 text-xs font-semibold uppercase tracking-widest text-neutral-500 underline underline-offset-4 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
      >
        Voltar para a Página Inicial
      </Link>
    </div>
  );
}
