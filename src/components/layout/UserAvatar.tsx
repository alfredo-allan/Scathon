'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

/**
 * Renders the signed-in user's avatar image, or a fallback image (/avatar.jpg)
 * when `avatarUrl` is null/undefined. Links to /account when logged in, /login otherwise.
 */
export function UserAvatar() {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return (
      <Link
        href="/login"
        aria-label="Entrar"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-7 2-7 4.5V20h14v-1.5c0-2.5-3-4.5-7-4.5Z" fill="currentColor" />
        </svg>
      </Link>
    )
  }

  return (
    <Link href="/account" aria-label={`Conta de ${user.displayName}`}>
      <Image src="/avatar.jpg" alt={user.displayName} width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
    </Link>
  )
}
