"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

/**
 * `/account` page body - a modest "Minha Conta" profile screen: who's
 * signed in, quick links into the two pages that already do real work
 * (`/account/orders`, `/wishlist`), the account's own details, and a way
 * to sign out. No editable fields yet (there's no backend to save them
 * to) - this is the landing spot the header/drawer's "Minha Conta" link
 * already pointed at, now with a real page behind it instead of a 404.
 */
export function AccountView() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Você precisa entrar pra ver sua conta.
        </p>
        <Link
          href="/login"
          className="bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
        >
          Entrar
        </Link>
      </div>
    );
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div className="px-4 md:px-8 py-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Página Inicial
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-neutral-900 dark:text-neutral-100">Minha Conta</li>
        </ol>
      </nav>

      <h1 className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50 md:text-2xl">
        Minha Conta
      </h1>

      <div className="mt-6 flex items-center gap-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <span className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.displayName}
              width={64}
              height={64}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xl font-semibold text-neutral-800 dark:text-neutral-100">
              {user.displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-neutral-950 dark:text-neutral-50">
            {user.displayName}
          </p>
          <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">{user.email}</p>
          {isAdmin && (
            <span className="mt-1 inline-block bg-neutral-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-50 dark:bg-neutral-100 dark:text-neutral-950">
              Admin
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/account/orders"
          className="group flex items-center justify-between border border-neutral-200 p-4 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
        >
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Meus Pedidos</p>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              Acompanhe suas compras e avalie produtos
            </p>
          </div>
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5" fill="none" aria-hidden>
            <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        <Link
          href="/wishlist"
          className="group flex items-center justify-between border border-neutral-200 p-4 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
        >
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Curtidos</p>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              Os produtos que você salvou como favoritos
            </p>
          </div>
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5" fill="none" aria-hidden>
            <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        <Link
          href="/account/addresses"
          className={`group flex items-center justify-between border border-neutral-200 p-4 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600 ${isAdmin ? "" : "sm:col-span-2"}`}
        >
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Meus Endereços</p>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              Salve mais de um endereço para sua preferência de entrega
            </p>
          </div>
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5" fill="none" aria-hidden>
            <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        {isAdmin && (
          <Link
            href="/admin"
            className="group flex items-center justify-between border border-neutral-200 p-4 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
          >
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Painel Admin</p>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                Pedidos, estoque, clientes, frete e integrações
              </p>
            </div>
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5" fill="none" aria-hidden>
              <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        )}
      </div>

      <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
          Dados da conta
        </h2>
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-4 border-b border-neutral-100 pb-2 dark:border-neutral-900">
            <dt className="text-neutral-500 dark:text-neutral-400">Nome</dt>
            <dd className="text-neutral-900 dark:text-neutral-100">{user.displayName}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-neutral-100 pb-2 dark:border-neutral-900">
            <dt className="text-neutral-500 dark:text-neutral-400">E-mail</dt>
            <dd className="text-neutral-900 dark:text-neutral-100">{user.email}</dd>
          </div>
          {user.phone && (
            <div className="flex justify-between gap-4 border-b border-neutral-100 pb-2 dark:border-neutral-900">
              <dt className="text-neutral-500 dark:text-neutral-400">Telefone</dt>
              <dd className="text-neutral-900 dark:text-neutral-100">{user.phone}</dd>
            </div>
          )}
        </dl>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-8 border border-neutral-300 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-900 transition-colors hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
      >
        Sair
      </button>
    </div>
  );
}
