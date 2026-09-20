'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useScrolledPast } from '@/hooks/useScrolledPast'
import { FLOATING_NAV_SCROLL_THRESHOLD } from '@/lib/layoutConstants'

export function FloatingDock() {
  const isVisible = useScrolledPast(FLOATING_NAV_SCROLL_THRESHOLD)

  return (
    <nav
      aria-label="Acesso rápido"
      aria-hidden={!isVisible}
      inert={!isVisible}
      className={`fixed inset-x-0 top-4 z-30 flex justify-center px-4 transition-all duration-300 ease-out sm:top-6 ${
        isVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-4 opacity-0'
      }`}>
      <div className="flex h-[50px] w-full max-w-[800px] items-center justify-between rounded-full border border-black/5 bg-neutral-100/90 px-8 shadow-lg shadow-black/10 backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/90 sm:px-12 md:w-[800px]">
        {/* 1. Recentes / Camadas */}
        <Link
          href="/account/orders"
          aria-label="Últimas compras"
          className="text-neutral-800 transition-colors hover:text-neutral-500 dark:text-neutral-100 dark:hover:text-neutral-400">
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden>
            <path d="m12 2 10 5-10 5-10-5z" />
            <path d="m2 12 10 5 10-5" />
            <path d="m2 17 10 5 10-5" />
          </svg>
        </Link>

        {/* 2. Favoritos / Coração (Path Corrigido) */}
        <Link
          href="/wishlist"
          aria-label="Favoritos"
          className="text-neutral-800 transition-colors hover:text-neutral-500 dark:text-neutral-100 dark:hover:text-neutral-400">
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden>
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </Link>

        {/* 3. Logo central */}
        <Link href="/" aria-label="Scathon" className="shrink-0">
          <Image
            src="/branding/BrandigLogoDark.png"
            alt="Scathon"
            width={500}
            height={211}
            className="block h-6 w-auto object-contain dark:hidden"
          />
          <Image
            src="/branding/BradingLogoLigth.png"
            alt="Scathon"
            width={500}
            height={211}
            className="hidden h-6 w-auto object-contain dark:block"
          />
        </Link>

        {/* 4. Carrinho / Sacola */}
        <Link
          href="/cart"
          aria-label="Carrinho"
          className="text-neutral-800 transition-colors hover:text-neutral-500 dark:text-neutral-100 dark:hover:text-neutral-400">
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden>
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </Link>

        {/* 5. Avatar com foto real do usuário */}
        <Link href="/account" aria-label="Minha Conta" className="shrink-0">
          <div className="relative h-8 w-8 overflow-hidden rounded-full border border-neutral-300 dark:border-neutral-700">
            <Image
              src="/avatar.jpg" // Altere para o caminho da sua foto no diretório /public
              alt="Avatar do usuário"
              fill
              className="object-cover"
            />
          </div>
        </Link>
      </div>
    </nav>
  )
}
