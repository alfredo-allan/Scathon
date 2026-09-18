"use client";

import type { ColorVariant } from "@/types";

interface ColorSwatchesProps {
  colors: ColorVariant[];
  activeColor: string;
  onSelect: (color: ColorVariant) => void;
}

/**
 * Interactive color options for a <ProductCard/>. Selecting a swatch
 * updates the active/hero image via the `onSelect` callback rather than
 * owning image state itself, so the parent stays the single source of
 * truth for "which variant is showing".
 */
export function ColorSwatches({ colors, activeColor, onSelect }: ColorSwatchesProps) {
  if (colors.length <= 1) return null;

  return (
    <div className="flex gap-1.5 mt-2">
      {colors.map((color) => {
        const isActive = color.name === activeColor;
        return (
          <button
            key={color.name}
            type="button"
            title={color.name}
            aria-label={color.name}
            aria-pressed={isActive}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onSelect(color);
            }}
            className={`h-5 w-5 rounded-full border transition-all ${
              isActive
                ? "ring-2 ring-offset-2 ring-neutral-900 dark:ring-neutral-100 ring-offset-white dark:ring-offset-neutral-950"
                : "border-neutral-300 dark:border-neutral-700"
            }`}
            style={{ backgroundColor: color.hex }}
          />
        );
      })}
    </div>
  );
}
