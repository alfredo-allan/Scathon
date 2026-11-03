"use client";

import Image from "next/image";
import Link from "next/link";
import { LogIn, UserPlus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { useAuth } from "@/hooks/useAuth";

const DISMISS_KEY = "scathon:auth-invite-dismissed";
let dismissedInMemory = false;

function getDismissedSnapshot() {
  if (typeof window === "undefined") return false;
  if (dismissedInMemory) return true;
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "true";
  } catch {
    return false;
  }
}

function subscribeToDismissal(onChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === DISMISS_KEY) onChange();
  }
  function handleLocalDismissal() {
    onChange();
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener("scathon:auth-invite-dismissed", handleLocalDismissal);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("scathon:auth-invite-dismissed", handleLocalDismissal);
  };
}

export function AuthInvite() {
  const { isAuthenticated } = useAuth();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isDismissed = useSyncExternalStore(
    subscribeToDismissal,
    getDismissedSnapshot,
    () => false,
  );
  const isOpen = !isAuthenticated && !isDismissed;

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      dismissedInMemory = true;
    }
    window.dispatchEvent(new Event("scathon:auth-invite-dismissed"));
  }, []);

  useEffect(() => {
    if (!isOpen || isAuthenticated || isDismissed) return;

    closeButtonRef.current?.focus();
    const timer = window.setTimeout(() => {
      dismiss();
    }, 5000);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isAuthenticated, isDismissed, dismiss]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 backdrop-blur-[2px] animate-fade-in"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-invite-title"
        aria-describedby="auth-invite-description"
        className="relative w-full max-w-md overflow-hidden rounded-app border border-neutral-200 bg-white shadow-2xl motion-safe:animate-auth-invite-enter dark:border-neutral-700 dark:bg-neutral-950"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-neutral-950 dark:bg-neutral-100" />
        <button
          ref={closeButtonRef}
          type="button"
          onClick={dismiss}
          aria-label="Fechar convite de acesso à conta"
          className="absolute right-3 top-3 z-10 rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-500 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="flex items-center justify-center border-b border-neutral-200 bg-neutral-50 px-8 py-5 dark:border-neutral-800 dark:bg-neutral-900">
          <Image
            src="/branding/BrandigLogoDark.png"
            alt="Scathon"
            width={180}
            height={76}
            className="h-12 w-auto object-contain dark:hidden"
          />
          <Image
            src="/branding/BradingLogoLigth.png"
            alt="Scathon"
            width={180}
            height={76}
            className="hidden h-12 w-auto object-contain dark:block"
          />
        </div>
        <div className="p-6 text-center sm:p-8">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
            <UserPlus className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 id="auth-invite-title" className="mt-4 text-lg font-semibold text-neutral-950 dark:text-neutral-50">
            Tenha uma experiência mais completa
          </h2>
          <p id="auth-invite-description" className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
            Entre ou crie sua conta para acompanhar pedidos e agilizar suas próximas compras. Você pode fechar e continuar navegando sem se identificar.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/login?mode=criar"
              className="inline-flex items-center justify-center gap-1.5 rounded-app bg-neutral-950 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Criar conta
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 rounded-app border border-neutral-300 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-800 transition-colors hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Entrar
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
