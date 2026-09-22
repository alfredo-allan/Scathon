"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { popularCategories } from "@/data/categories";

interface DrawerMenuProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Hamburger-triggered side drawer covering 50% of the screen width
 * (capped at `max-w-sm` on larger viewports).
 */
export function DrawerMenu({ open, onClose }: DrawerMenuProps) {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <>
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`w-1/2 max-w-sm fixed left-0 top-0 h-full z-50 bg-white dark:bg-neutral-900 transition-transform duration-300 ease-out flex flex-col ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <span className="text-sm font-semibold uppercase tracking-widest">
            Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="p-1 text-neutral-600 dark:text-neutral-400"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <ul className="flex flex-col gap-3 text-sm font-medium tracking-wide uppercase">
            {popularCategories.map((category) => (
              <li key={category.id}>
                <Link href={category.href} onClick={onClose}>
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>

          {/*
            "Minha Conta" and "Entrar / Criar Conta" now point at real
            pages (`/account`, `/login`). "Painel Admin" still goes to `/`
            for now - there's no admin backend/data to build a real panel
            against yet, so that one hardcoded href stays a placeholder
            until there's something real to link to.
          */}
          <div className="mt-8 border-t border-neutral-200 dark:border-neutral-800 pt-4 flex flex-col gap-3 text-sm">
            {isAuthenticated ? (
              <>
                <span className="text-neutral-500 dark:text-neutral-400">
                  Olá, {user?.displayName}
                </span>
                <Link href="/account" onClick={onClose}>
                  Minha Conta
                </Link>
                {isAdmin && (
                  <Link href="/" onClick={onClose}>
                    Painel Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="text-left text-neutral-500 dark:text-neutral-400"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link href="/login" onClick={onClose}>
                Entrar / Criar Conta
              </Link>
            )}
          </div>
        </nav>

        <button
          type="button"
          onClick={toggleTheme}
          className="m-4 flex items-center justify-between rounded-none border border-neutral-200 dark:border-neutral-800 px-4 py-3 text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-400"
        >
          <span>Tema</span>
          <span>{theme === "dark" ? "Escuro" : "Claro"}</span>
        </button>
      </aside>
    </>
  );
}
