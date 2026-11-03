"use client";

import Link from "next/link";
import { LogIn, UserPlus, X } from "lucide-react";
import { useSyncExternalStore } from "react";
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
  const isDismissed = useSyncExternalStore(
    subscribeToDismissal,
    getDismissedSnapshot,
    () => false,
  );

  if (isAuthenticated || isDismissed) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      dismissedInMemory = true;
    }
    window.dispatchEvent(new Event("scathon:auth-invite-dismissed"));
  }

  return (
    <aside
      aria-label="Acesso à conta"
      className="mx-4 mt-6 flex items-start gap-3 rounded-app border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/70 md:mx-8"
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
        <UserPlus className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          Entre para acompanhar seus pedidos e agilizar suas compras.
        </p>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          Você também pode continuar navegando sem criar uma conta.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-app bg-neutral-950 px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
          >
            <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
            Entrar
          </Link>
          <Link
            href="/login?mode=criar"
            className="rounded-app border border-neutral-300 px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-800 transition-colors hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
          >
            Criar conta
          </Link>
        </div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dispensar convite de acesso à conta"
        className="shrink-0 rounded-full p-1 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </aside>
  );
}
