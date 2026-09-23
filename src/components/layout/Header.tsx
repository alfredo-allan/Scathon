'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useScrolledPast } from '@/hooks/useScrolledPast'
import { FLOATING_NAV_SCROLL_THRESHOLD } from '@/lib/layoutConstants'
import { CategoryBar } from './CategoryBar'
import { DrawerMenu } from './DrawerMenu'
import { HeaderActions } from './HeaderActions'
import { SearchOverlay } from './SearchOverlay'

/**
 * Sticky site header: hamburger + drawer, wordmark, search trigger,
 * theme toggle, account avatar and cart, with the category quick-links
 * bar underneath.
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
        <div className="grid h-[90px] grid-cols-[auto_1fr_auto] items-center gap-2 px-4 sm:grid-cols-[1fr_auto_1fr] md:px-8">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu"
            className="justify-self-start p-1 text-neutral-800 dark:text-neutral-100">
            {/* Ícone de menu aumentado (h-7 w-7) */}
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden>
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

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

        <CategoryBar />
      </div>

      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}
