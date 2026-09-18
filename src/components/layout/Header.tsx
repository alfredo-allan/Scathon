"use client";

import Link from "next/link";
import { useState } from "react";
import { CartBadge } from "./CartBadge";
import { CategoryBar } from "./CategoryBar";
import { DrawerMenu } from "./DrawerMenu";
import { SearchOverlay } from "./SearchOverlay";
import { ThemeToggle } from "./ThemeToggle";
import { UserAvatar } from "./UserAvatar";

/**
 * Sticky site header: hamburger + drawer, wordmark, search trigger,
 * theme toggle, account avatar and cart, with the category quick-links
 * bar underneath.
 */
export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-4 md:px-8 py-4">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="justify-self-start p-1 text-neutral-800 dark:text-neutral-100"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/*
          A CSS Grid with auto/1fr/auto columns (instead of a flex row +
          `absolute left-1/2` logo) keeps the wordmark centered in the
          space actually left over between the hamburger and the icon
          cluster. The old absolute-positioning approach centered the
          logo on the *whole* header width, so on narrow/mobile screens -
          where the icon cluster takes up proportionally more room - it
          visually overlapped the icons (and, because absolutely
          positioned elements paint above static ones, could even
          intercept taps meant for the search button underneath it).
        */}
        <Link
          href="/"
          className="min-w-0 justify-self-center truncate text-base sm:text-lg font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-neutral-950 dark:text-neutral-50"
        >
          Scathon
        </Link>

        <div className="flex items-center justify-self-end gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Open search"
            className="p-1 text-neutral-800 dark:text-neutral-100"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <ThemeToggle />
          <UserAvatar />
          <CartBadge />
        </div>
      </div>

      <CategoryBar />

      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
