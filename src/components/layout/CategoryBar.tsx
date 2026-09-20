import Link from "next/link";
import { categories } from "@/data/categories";

/**
 * Quick-access category links below the main header row.
 */
export function CategoryBar() {
  return (
    <nav
      aria-label="Categorias"
      className="flex gap-6 overflow-x-auto no-scrollbar text-xs font-medium tracking-widest uppercase py-3 border-b border-neutral-200 dark:border-neutral-800 px-4 md:px-8"
    >
      {categories.map((category) => (
        <Link
          key={category.id}
          href={category.href}
          className="shrink-0 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-neutral-50 transition-colors"
        >
          {category.label}
        </Link>
      ))}
    </nav>
  );
}
