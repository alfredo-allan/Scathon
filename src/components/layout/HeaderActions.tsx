"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { CartBadge } from "./CartBadge";
import { ThemeToggle } from "./ThemeToggle";
import { UserAvatar } from "./UserAvatar";

/** Generic "more actions" glyph - the mobile chip's default, cart-less state. */
function MoreGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <circle cx="5" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

/**
 * Visual-only cart glyph + live count, mirroring what `<CartBadge/>`
 * shows - but with no link of its own, since this sits inside the
 * toggle button (whose job is always to open the pill, never to jump
 * straight to /cart; the real, clickable `<CartBadge/>` lives in the
 * revealed row below).
 */
function CartGlyph({ count }: { count: number }) {
  return (
    <span className="relative flex h-4 w-4 items-center justify-center">
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
        <path
          d="M6 8h12l-1 12H7L6 8Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <span
        aria-hidden
        className="absolute -right-2.5 -top-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold leading-none text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {count > 99 ? "99+" : count}
      </span>
    </span>
  );
}

/** Shared search-trigger button, sized independently from its hit area. */
function SearchButton({
  onClick,
  className,
  iconClassName = "h-4 w-4",
}: {
  onClick: () => void;
  className: string;
  iconClassName?: string;
}) {
  return (
    <button type="button" onClick={onClick} aria-label="Buscar" className={className}>
      <svg viewBox="0 0 24 24" className={iconClassName} fill="none" aria-hidden>
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}

interface HeaderActionsProps {
  onSearchOpen: () => void;
}

/**
 * Mobile-only collapsible "dynamic island"-style action cluster, paired
 * with a plain always-visible icon row for tablet/desktop - the phone's
 * narrow width is the only reason these controls get hidden behind a
 * chip in the first place, so from `sm` up they're just shown normally
 * side by side, same as before this component existed. Both markups
 * always render; only Tailwind's `sm:` breakpoint decides which one is
 * `display:none`, so there's no JS media query and nothing that could
 * mismatch between server and client render.
 *
 * --- Mobile chip (below `sm`) ---
 * Collapsed, it's a single circular chip: a generic "more" glyph, or -
 * the moment the bag has something in it - the cart glyph with its
 * live count standing in for it (tapping the chip still always opens
 * the pill, it never jumps straight to /cart on its own).
 *
 * Tapping the chip - or tapping outside it, or pressing Escape - grows
 * it sideways into a pill that reveals search, theme, account and the
 * real cart link side by side. It lives in normal flow, not as an
 * absolutely-positioned overlay: it's a real grid item in the header's
 * `auto` third column, so growing it re-measures that column and the
 * centre (`1fr`) column shrinks to match - the wordmark eases left
 * instead of the pill sitting on top of it.
 */
export function HeaderActions({ onSearchOpen }: HeaderActionsProps) {
  const [expanded, setExpanded] = useState(false);
  const { cartCount } = useCart();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded) return;

    function handlePointerDown(event: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setExpanded(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setExpanded(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [expanded]);

  return (
    <>
      {/* Mobile: collapsible chip -> pill. Hidden entirely from `sm` up. */}
      <div
        ref={wrapperRef}
        className={`flex h-10 shrink-0 items-center justify-self-end rounded-full bg-neutral-100 transition-[width] duration-300 ease-out dark:bg-neutral-800 sm:hidden ${
          expanded ? "w-[196px]" : "w-10 justify-center"
        }`}
      >
        {/*
          The rounded pill background has no `overflow-hidden` of its
          own, so it never clips anything sitting on top of it - only
          the plain, square-cornered wrapper just below does, purely to
          animate the reveal. That wrapper's own trailing padding
          (pr-4) is sized to fully contain the real `<CartBadge/>`
          count, which - like any badge - pokes outside its icon's own
          box; a rounded corner clipping straight through that badge is
          exactly the bug this split avoids.
        */}
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-label={
            cartCount > 0
              ? `Carrinho, ${cartCount} ${cartCount === 1 ? "item" : "itens"} - abrir menu de ações`
              : "Abrir menu de ações"
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-800 dark:text-neutral-100"
        >
          {cartCount > 0 ? <CartGlyph count={cartCount} /> : <MoreGlyph />}
        </button>

        <div
          className={`flex items-center gap-2 overflow-hidden transition-[width] duration-300 ease-out ${
            expanded ? "w-[156px] pr-4" : "pointer-events-none w-0 pr-0"
          }`}
        >
          <SearchButton
            onClick={() => {
              onSearchOpen();
              setExpanded(false);
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center text-neutral-700 dark:text-neutral-200"
          />
          <ThemeToggle />
          <UserAvatar />
          <CartBadge />
        </div>
      </div>

      {/* Tablet/desktop: no collapsing, icons sit side by side as usual. */}
      <div className="hidden justify-self-end sm:flex sm:items-center sm:gap-4">
        <SearchButton
          onClick={onSearchOpen}
          className="p-1 text-neutral-800 dark:text-neutral-100"
          iconClassName="h-5 w-5"
        />
        <ThemeToggle />
        <UserAvatar />
        <CartBadge />
      </div>
    </>
  );
}
