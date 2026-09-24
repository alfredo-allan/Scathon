'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useScrolledPast } from '@/hooks/useScrolledPast'
import { FLOATING_NAV_SCROLL_THRESHOLD } from '@/lib/layoutConstants'
import { categories } from '@/data/categories'
import { DrawerMenu } from './DrawerMenu'
import { HeaderActions } from './HeaderActions'
import { SearchOverlay } from './SearchOverlay'

/**
 * Quick-access category links, inline in the header's own row at every
 * breakpoint now - mobile used to push these into their own separate row
 * below (`<CategoryBar/>`) since a 90px row had no space for them, but
 * folding the header down to one row everywhere (see `<Header/>`'s doc
 * comment) means this nav has to carry them on mobile too now. `min-w-0
 * flex-1` + `overflow-x-auto no-scrollbar` so a width too tight to fit
 * every label - mobile most of all, tablet too - scrolls these links
 * horizontally instead of pushing the centered wordmark off-center or
 * forcing the row taller than its fixed height. (`min-w-0` alone on this
 * nav wasn't enough - it needs `flex-1` too, so it's the one flex child
 * that actually gives up width to the hamburger button and shrinks/
 * scrolls, rather than the flex row just overflowing its own box; see
 * `<Header/>`'s wrapping div for the other half of this.)
 */
function HeaderCategoryLinks() {
  return (
    <nav
      aria-label="Categorias"
      className="no-scrollbar flex min-w-0 flex-1 items-center gap-3 overflow-x-auto text-xs font-medium uppercase tracking-widest sm:gap-5 lg:gap-7">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={category.href}
          className="hidden md:inline-block group relative shrink-0 whitespace-nowrap py-1.5 text-neutral-700 transition-colors hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-neutral-50">
          {category.label}
          {/* Modern, subtle hover underline - grows out from the center
              (`origin-center scale-x-0 -> scale-x-100`) rather than
              sliding in from one edge, and rides on `bg-current` so it
              always matches the link's own (already-hovered) text color
              instead of a separate hardcoded one. Renders at every
              breakpoint now (mobile included) - this link only ever
              lives here, never in `<DrawerMenu/>`. Anchored at `bottom-0`
              *inside* the link's own `py-1.5` -
              not pushed below it with a negative offset - because this
              nav has `overflow-x-auto` for the horizontal-scroll fallback
              above, and per the CSS spec, pairing `overflow-x: auto` with
              an implicit `overflow-y: visible` computes the y-axis to
              `auto` too, not `visible` - so anything actually escaping a
              link's own box (like a negative-offset underline) was
              getting silently clipped instead of shown. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-center scale-x-0 bg-current transition-transform duration-300 ease-out group-hover:scale-x-100"
          />
        </Link>
      ))}
    </nav>
  )
}

/**
 * Sticky site header - a second usability pass folded the old two-row
 * mobile layout (a 90px main row + a separate `<CategoryBar/>` row
 * underneath) into one row too, so now every breakpoint is a single row,
 * just at two different fixed heights: `h-[100px] sm:h-[80px]`.
 *
 *  - Mobile (below `sm`): hamburger, category quick-links, centered
 *    wordmark and actions all share the one 100px row - taller than
 *    desktop/tablet's 80px on purpose (this was a deliberate, explicit
 *    choice, not a leftover default) since a phone-width row carrying
 *    every one of those pieces needs more headroom than a wide desktop
 *    row does. The category links lean on `overflow-x-auto no-scrollbar`
 *    (see `<HeaderCategoryLinks/>`) to scroll internally rather than wrap
 *    or overflow when they don't all fit next to the hamburger.
 *  - Tablet/desktop (`sm`+, matching the same breakpoint `<HeaderActions/>`
 *    already splits its own mobile-chip/plain-icons markup on): unchanged
 *    from the previous pass - category links sit inline next to the
 *    hamburger, in the same single 80px row as the logo and the action
 *    icons.
 *
 * `<CategoryBar/>`'s separate row is gone entirely now - both breakpoints
 * get their category links from `<HeaderCategoryLinks/>` in the row
 * above, so nothing renders it any more (the component file itself is
 * left in place unused rather than deleted, in case a future layout wants
 * a standalone category row again).
 */
export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const isScrolled = useScrolledPast(FLOATING_NAV_SCROLL_THRESHOLD)

  return (
    <header>
      <div
        className={`sticky top-0 z-30 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 transition-transform duration-300 ease-out ${
          isScrolled ? '-translate-y-full pointer-events-none' : 'translate-y-0'
        }`}>
        <div className="grid h-[70px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 sm:h-[80px] md:px-8">
          {/* No `justify-self-start` here on purpose - that would opt this
              item out of the grid's default stretch alignment, so it'd
              size to its own (unshrinkable) content instead of the `1fr`
              track's real, possibly-narrower width, and the category links
              below would overflow past the centered wordmark instead of
              scrolling within their own space. */}
          <div className="flex min-w-0 items-center gap-3 sm:gap-5 lg:gap-7">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menu"
              className="shrink-0 p-1 text-neutral-800 dark:text-neutral-100">
              {/* Ícone de menu aumentado (h-7 w-7) */}
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden>
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            <HeaderCategoryLinks />
          </div>

          <Link href="/" aria-label="Scathon" className="min-w-0 shrink-0 justify-self-center">
            {/* Logos aumentadas (h-14 sm:h-16) */}
            <Image
              src="/branding/BrandigLogoDark.png"
              alt="Scathon"
              width={500}
              height={211}
              priority
              className="block h-14 w-auto object-contain dark:hidden sm:h-16"
            />
            <Image
              src="/branding/BradingLogoLigth.png"
              alt="Scathon"
              width={500}
              height={211}
              priority
              className="hidden h-14 w-auto object-contain dark:block sm:h-16"
            />
          </Link>

          <HeaderActions onSearchOpen={() => setSearchOpen(true)} />
        </div>
      </div>

      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}
