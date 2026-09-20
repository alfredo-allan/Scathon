"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useScrolledPast } from "@/hooks/useScrolledPast";
import { FLOATING_NAV_SCROLL_THRESHOLD } from "@/lib/layoutConstants";
import { CategoryBar } from "./CategoryBar";
import { DrawerMenu } from "./DrawerMenu";
import { HeaderActions } from "./HeaderActions";
import { SearchOverlay } from "./SearchOverlay";

/**
 * Sticky site header: hamburger + drawer, wordmark, search trigger,
 * theme toggle, account avatar and cart, with the category quick-links
 * bar underneath.
 *
 * Nothing about the header's own markup, sizing or styling changes here -
 * the only addition is that its sticky bar slides up out of view once the
 * page scrolls past `FLOATING_NAV_SCROLL_THRESHOLD`, handing off to the
 * floating <FloatingDock/> pill (see that component; both read the same
 * threshold via `useScrolledPast` so they flip in sync). That slide is
 * applied to an inner wrapper, not the outer <header> tag itself, on
 * purpose: <DrawerMenu/> and <SearchOverlay/> are fixed-position overlays
 * rendered as this header's children, and a CSS `transform` on an
 * ancestor becomes the containing block for any `position: fixed`
 * descendant - transforming the whole <header> would drag those two
 * overlays along with it (and off-screen) the moment they're opened while
 * scrolled. Keeping them as siblings of the transformed bar, both still
 * inside <header>, sidesteps that entirely.
 */
export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const isScrolled = useScrolledPast(FLOATING_NAV_SCROLL_THRESHOLD);

  return (
    <header>
      <div
        className={`sticky top-0 z-30 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 transition-transform duration-300 ease-out ${
          isScrolled ? "-translate-y-full pointer-events-none" : "translate-y-0"
        }`}
      >
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-4 py-3 sm:grid-cols-[1fr_auto_1fr] md:px-8 sm:py-4">
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
            Below `sm`: a CSS Grid with auto/1fr/auto columns (instead of a
            flex row + `absolute left-1/2` logo) keeps the wordmark centered
            in the space actually left over between the hamburger and the
            icon cluster. The old absolute-positioning approach centered
            the logo on the *whole* header width, so on narrow/mobile
            screens - where the icon cluster takes up proportionally more
            room - it visually overlapped the icons (and, because
            absolutely positioned elements paint above static ones, could
            even intercept taps meant for the search button underneath
            it). The mobile action cluster is also a single collapsible
            chip/pill here (see HeaderActions), and letting its `auto`
            column grow when the pill expands is what eases the logo aside
            instead of the pill covering it.

            From `sm` up: the icon cluster is a plain always-visible row
            (search/theme/avatar/cart) that's meaningfully wider than the
            hamburger, so those two `auto` columns are no longer the same
            width and the logo - centered only *within* the leftover
            middle column - visibly drifts toward the hamburger side.
            Tablet/desktop have the width to spare, so we switch to
            1fr/auto/1fr: both side columns claim an equal share of the
            row (as long as neither side's content needs more than half
            the remaining width, which holds here), which pins the logo to
            the header's true center instead of an off-center leftover
            gap.
          */}
          <Link
            href="/"
            aria-label="Scathon"
            className="min-w-0 shrink-0 justify-self-center"
          >
            {/*
              Two theme-specific wordmarks, toggled purely with CSS
              (`dark:` variants) rather than JS - so there's no flash of
              the wrong logo before hydration/theme detection runs. Each
              source is the full 500x211 asset; `w-auto` + a fixed height
              keeps it crisp and scaled proportionally instead of
              stretched. The filenames name the mark's own color ("Ligth"
              = white ink, "Dark" = black ink), not which theme they
              belong to, so the light-mode header (white bg) gets the
              dark/black-ink mark and the dark-mode header (near-black
              bg) gets the light/white-ink mark - otherwise the logo
              would vanish into its own background. Sized deliberately
              large (h-10/h-14) - the header now hides its secondary
              controls behind <HeaderActions/> specifically so this mark
              can own the centre column without competing for space.
            */}
            <Image
              src="/branding/BrandigLogoDark.png"
              alt="Scathon"
              width={500}
              height={211}
              priority
              className="block h-10 w-auto object-contain dark:hidden sm:h-14"
            />
            <Image
              src="/branding/BradingLogoLigth.png"
              alt="Scathon"
              width={500}
              height={211}
              priority
              className="hidden h-10 w-auto object-contain dark:block sm:h-14"
            />
          </Link>

          <HeaderActions onSearchOpen={() => setSearchOpen(true)} />
        </div>

        <CategoryBar />
      </div>

      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
