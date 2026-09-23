'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useScrolledPast } from '@/hooks/useScrolledPast'
import { FLOATING_NAV_SCROLL_THRESHOLD } from '@/lib/layoutConstants'
import { CartBadge } from './CartBadge'
import { UserAvatar } from './UserAvatar'

/**
 * Floating "dock"-style anchor nav, inspired by a Linux Plank/macOS dock:
 * a pill fixed near the TOP of the viewport that only appears once the
 * page is scrolled, standing in for the static <Header/> without ever
 * touching it - <Header/> keeps its exact current markup, sizing and
 * styling; it just slides out of view above the fold (see its own
 * `useScrolledPast` usage) while this pill drops in from above, in
 * perfect sync since both read the same `FLOATING_NAV_SCROLL_THRESHOLD`.
 * Active at every breakpoint (mobile and desktop alike) - unlike some
 * other effects in this app, there's no desktop-only gate here.
 *
 * Sized noticeably larger on desktop and only a touch larger on mobile
 * (padding/gap/icon size all scale up at `sm` and again at `lg`), so it
 * reads as a deliberate, roomy dock rather than the header's own compact
 * icon row. <CartBadge/> and <UserAvatar/> are reused as-is (so the live
 * count and sign-in state always match the header) but are visually
 * scaled up via a wrapping `scale-*` transform at each breakpoint instead
 * of resizing those two components themselves - they're also rendered
 * inside <Header/>, and scaling the shared component would have enlarged
 * them there too, which is exactly the "don't touch the header" rule
 * from when this dock was first built.
 *
 * Left to right, per the requested layout:
 *  1. Recent orders - links to /account/orders (a panel/page with order
 *     history + reorder suggestions is planned there; the route doesn't
 *     exist yet, matching how /cart, /account and /login are already
 *     linked elsewhere in this app before their pages are built).
 *  2. Wishlist - links to /wishlist (liked products; same "route not
 *     built yet" situation).
 *  3. Wordmark - links home, theme-aware like the header's own logo.
 *  4. Cart - reuses <CartBadge/> so the live item count always matches
 *     what the header shows (single source of truth: useCart()).
 *  5. Account - reuses <UserAvatar/> so it shows the same sign-in photo
 *     or initial the header does, via the same useAuth() state.
 */
export function FloatingDock() {
  const isVisible = useScrolledPast(FLOATING_NAV_SCROLL_THRESHOLD)

  return (
    <nav
      aria-label="Acesso rápido"
      aria-hidden={!isVisible}
      // `inert` (a real DOM attribute React 19 passes through) removes
      // every descendant - including the ones inside <CartBadge/> and
      // <UserAvatar/> - from focus and pointer interaction in one go
      // whenever the dock is hidden, instead of hand-toggling `tabIndex`
      // on each link (which wouldn't reach those two reused components'
      // own internal <Link>s anyway).
      inert={!isVisible}
      // z-30 (same tier as <Header/>'s own bar, not the z-40/z-50 used by
      // <DrawerMenu/>'s backdrop/panel and <SearchOverlay/>) so those
      // modals always paint above the dock instead of the dock winning a
      // stacking tie just because it's later in the DOM (it lives in
      // layout.tsx, after <Header/>).
      // `px-4 md:px-8` here matches <Header/>'s own side padding exactly -
      // the dock now spans the same edge-to-edge width as the header bar
      // it stands in for, instead of hugging its own content into a small
      // centered pill. `w-full` on the inner bar (below) is what actually
      // stretches it; this wrapper just sets the same margins Header uses.
      className={`fixed inset-x-0 top-4 z-30 px-4 transition-all duration-300 ease-out sm:top-6 md:px-8 ${
        isVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-4 opacity-0'
      }`}>
      {/* `rounded-3xl` - mantido com border-radius maior conforme solicitado.
          Altura ajustada para h-14 / sm:h-16 / lg:h-20 para ser sutilmente menor. */}
      <div className="mx-auto flex h-12 w-full max-w-[800px] items-center justify-between rounded-2xl border border-black/5 bg-neutral-100/90 px-6 shadow-lg shadow-black/10 backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/80 sm:h-16 sm:px-10 lg:h-[55px] lg:px-16">
        <Link
          href="/account/orders"
          aria-label="Últimas compras"
          className="text-neutral-800 transition-colors hover:text-neutral-500 dark:text-neutral-100 dark:hover:text-neutral-400">
          <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-7 sm:w-7 lg:h-9 lg:w-9" fill="none" aria-hidden>
            <path d="M4 7l8-4 8 4-8 4-8-4Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
            <path d="M4 12l8 4 8-4M4 17l8 4 8-4" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
          </svg>
        </Link>

        <Link
          href="/wishlist"
          aria-label="Favoritos"
          className="text-neutral-800 transition-colors hover:text-neutral-500 dark:text-neutral-100 dark:hover:text-neutral-400">
          <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-7 sm:w-7 lg:h-9 lg:w-9" fill="none" aria-hidden>
            <path
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        <Link href="/" aria-label="Scathon" className="shrink-0">
          <Image
            src="/branding/BrandigLogoDark.png"
            alt="Scathon"
            width={500}
            height={211}
            className="block h-6 w-auto object-contain dark:hidden sm:h-8 lg:h-11"
          />
          <Image
            src="/branding/BradingLogoLigth.png"
            alt="Scathon"
            width={500}
            height={211}
            className="hidden h-6 w-auto object-contain dark:block sm:h-8 lg:h-11"
          />
        </Link>

        <div className="text-neutral-800 transition-colors hover:text-neutral-500 dark:text-neutral-100 dark:hover:text-neutral-400">
          <Link href="/cart" aria-label="Carrinho de compras" className="relative inline-flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 sm:h-7 sm:w-7 lg:h-9 lg:w-9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true">
              <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121 0 2.085-.758 2.348-1.85l1.3-5.419A1.125 1.125 0 0 0 20.316 5.75H5.106M7.5 14.25l-1.002-4.008" />
              <circle cx="7.5" cy="19.5" r="1.25" fill="currentColor" />
              <circle cx="18" cy="19.5" r="1.25" fill="currentColor" />
            </svg>
          </Link>
        </div>

        <div className="scale-90 transition-transform sm:scale-100 lg:scale-110">
          <UserAvatar />
        </div>
      </div>
    </nav>
  )
}
