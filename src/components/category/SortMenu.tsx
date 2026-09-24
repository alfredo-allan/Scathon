"use client";

import { useEffect, useRef, useState } from "react";

export interface SortOption {
  id: string;
  label: string;
}

interface SortMenuProps {
  options: SortOption[];
  value: string;
  onChange: (id: string) => void;
}

/**
 * "Ordenar por" dropdown for the category listing page (the reference
 * screenshot's "Lançamentos ⌄" pill in the top-right). Same outside-click +
 * Escape-to-close pattern as `<HeaderActions/>`'s mobile action pill, for
 * consistency across the app rather than reinventing a third popover
 * implementation.
 */
export function SortMenu({ options, value, onChange }: SortMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const activeLabel = options.find((option) => option.id === value)?.label ?? options[0]?.label;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-2 rounded-app border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-xs font-medium uppercase tracking-widest text-neutral-800 dark:text-neutral-100 transition-colors hover:border-neutral-500 dark:hover:border-neutral-500"
      >
        {activeLabel}
        <svg
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-app border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg"
        >
          <ul className="py-1">
            {options.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.id === value}
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                    option.id === value
                      ? "font-semibold text-neutral-950 dark:text-neutral-50"
                      : "text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
