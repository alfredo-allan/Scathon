"use client";

import { useState, type ReactNode } from "react";

export interface ColorOption {
  name: string;
  hex: string;
}

export interface PriceBucket {
  id: string;
  label: string;
  test: (price: number) => boolean;
}

export interface RatingOption {
  id: string;
  label: string;
  min: number;
}

interface CategoryFiltersProps {
  availableColors: ColorOption[];
  selectedColors: Set<string>;
  onToggleColor: (name: string) => void;
  priceBuckets: PriceBucket[];
  selectedPriceBuckets: Set<string>;
  onTogglePriceBucket: (id: string) => void;
  ratingOptions: RatingOption[];
  minRating: number | null;
  onSetMinRating: (min: number | null) => void;
  onlyNew: boolean;
  onToggleOnlyNew: () => void;
  hasActiveFilters: boolean;
  onClear: () => void;
}

/**
 * One collapsible filter section (Preço, Cores, ...). Uses a `grid-rows`
 * transition (0fr <-> 1fr) instead of the `max-h-*` trick `<Footer/>`'s
 * accordion uses - no arbitrary max-height guess needed, and it animates
 * correctly no matter how many options a given group ends up with.
 */
function FilterGroup({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800 py-4">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100"
      >
        {title}
        <svg
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 text-neutral-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          isOpen ? "mt-3 grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

/**
 * Sidebar filter groups for the `/shop/[category]` listing (also reused
 * inside the mobile "Filtros" drawer - see `<CategoryListing/>`). Scoped to
 * filters that actually mean something for a single-brand streetwear
 * catalog (price, color, rating, new-in) rather than copying every filter
 * from the multi-brand sporting-goods reference screenshot (Marca, Times,
 * Esportes, ... don't apply here).
 */
export function CategoryFilters({
  availableColors,
  selectedColors,
  onToggleColor,
  priceBuckets,
  selectedPriceBuckets,
  onTogglePriceBucket,
  ratingOptions,
  minRating,
  onSetMinRating,
  onlyNew,
  onToggleOnlyNew,
  hasActiveFilters,
  onClear,
}: CategoryFiltersProps) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["preco", "cores"]));

  function toggleGroup(id: string) {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
          Filtrar por
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            Limpar
          </button>
        )}
      </div>

      <FilterGroup title="Novidades" isOpen={openGroups.has("novidades")} onToggle={() => toggleGroup("novidades")}>
        <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
          <input
            type="checkbox"
            checked={onlyNew}
            onChange={onToggleOnlyNew}
            className="h-4 w-4 accent-neutral-900 dark:accent-neutral-100"
          />
          Somente lançamentos
        </label>
      </FilterGroup>

      <FilterGroup title="Preço" isOpen={openGroups.has("preco")} onToggle={() => toggleGroup("preco")}>
        <ul className="flex flex-col gap-2.5">
          {priceBuckets.map((bucket) => (
            <li key={bucket.id}>
              <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={selectedPriceBuckets.has(bucket.id)}
                  onChange={() => onTogglePriceBucket(bucket.id)}
                  className="h-4 w-4 accent-neutral-900 dark:accent-neutral-100"
                />
                {bucket.label}
              </label>
            </li>
          ))}
        </ul>
      </FilterGroup>

      {availableColors.length > 0 && (
        <FilterGroup title="Cores" isOpen={openGroups.has("cores")} onToggle={() => toggleGroup("cores")}>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((color) => {
              const isActive = selectedColors.has(color.name);
              return (
                <button
                  key={color.name}
                  type="button"
                  title={color.name}
                  aria-label={color.name}
                  aria-pressed={isActive}
                  onClick={() => onToggleColor(color.name)}
                  className={`h-7 w-7 shrink-0 rounded-full border transition-all ${
                    isActive
                      ? "ring-2 ring-offset-2 ring-neutral-900 dark:ring-neutral-100 ring-offset-white dark:ring-offset-neutral-950"
                      : "border-neutral-300 dark:border-neutral-700"
                  }`}
                  style={{ backgroundColor: color.hex }}
                />
              );
            })}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Avaliação" isOpen={openGroups.has("avaliacao")} onToggle={() => toggleGroup("avaliacao")}>
        <ul className="flex flex-col gap-2.5">
          {ratingOptions.map((option) => (
            <li key={option.id}>
              <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <input
                  type="radio"
                  name="rating"
                  checked={minRating === option.min}
                  onChange={() => onSetMinRating(option.min)}
                  className="h-4 w-4 accent-neutral-900 dark:accent-neutral-100"
                />
                {option.label}
              </label>
            </li>
          ))}
          {minRating !== null && (
            <li>
              <button
                type="button"
                onClick={() => onSetMinRating(null)}
                className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                Remover filtro de avaliação
              </button>
            </li>
          )}
        </ul>
      </FilterGroup>
    </div>
  );
}
