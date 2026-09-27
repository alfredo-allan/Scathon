"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

/**
 * Top bar for the whole `/admin` section - swapped in for the storefront's
 * `<Header/>` by `<SiteChrome/>` whenever the current route starts with
 * `/admin` (see that component's doc comment). This is the "navegabilidade
 * completamente diferente" Alfredo asked for: no busca de produtos, sem
 * carrinho, sem curtidos, sem categorias de loja - só o que um administrador
 * de fato usa aqui (voltar pro painel, alternar tema, ver a loja como
 * visitante, saber quem está logado, sair).
 *
 * Deliberately small and un-fancy compared to the storefront header - this
 * is a back-office tool, not a merchandising surface, matching the "mais
 * objetiva e de fato administrativa" framing from the request.
 */
export function AdminHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-8">
        <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/branding/BrandigLogoDark.png"
            alt="Scathon"
            width={500}
            height={211}
            className="block h-6 w-auto shrink-0 object-contain dark:hidden"
          />
          <Image
            src="/branding/BradingLogoLigth.png"
            alt="Scathon"
            width={500}
            height={211}
            className="hidden h-6 w-auto shrink-0 object-contain dark:block"
          />
          <span className="hidden shrink-0 text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 sm:inline">
            Painel Admin
          </span>
        </Link>

        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Usar tema claro" : "Usar tema escuro"}
            className="rounded-app border border-neutral-200 px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-100"
          >
            {theme === "dark" ? "Escuro" : "Claro"}
          </button>

          <Link
            href="/"
            className="hidden text-xs font-medium uppercase tracking-widest text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 sm:inline"
          >
            Ver loja
          </Link>

          {user && (
            <span className="hidden max-w-[10rem] truncate text-xs text-neutral-500 dark:text-neutral-400 md:inline">
              {user.displayName}
            </span>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-app border border-neutral-300 px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-900 transition-colors hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
