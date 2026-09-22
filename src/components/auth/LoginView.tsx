"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { MOCK_CUSTOMER } from "@/context/AuthContext";

type Mode = "entrar" | "criar";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * `/login` page body: a real, responsive sign-in/sign-up screen (split
 * photo panel from `lg` up, single centered column below it) rather than
 * a dead link - there's still no auth backend, so submitting either tab
 * just calls `useAuth().login()` with the name/e-mail typed in laid over
 * the same mock customer identity (`MOCK_CUSTOMER`) the rest of the app
 * already previews, then sends the visitor home. Swap the body of
 * `handleSubmit` for a real request once there's an endpoint to call -
 * the form itself (validation, both tabs, the "already signed in" state)
 * doesn't need to change.
 */
export function LoginView() {
  const router = useRouter();
  const { isAuthenticated, user, login, logout } = useAuth();

  const [mode, setMode] = useState<Mode>("entrar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError("Digite um e-mail válido.");
      return;
    }
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (mode === "criar" && name.trim().length < 2) {
      setError("Digite seu nome.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    login(`mock-token-${Date.now()}`, {
      ...MOCK_CUSTOMER,
      email: trimmedEmail,
      displayName: mode === "criar" && name.trim() ? name.trim() : MOCK_CUSTOMER.displayName,
    });
    router.push("/");
  }

  // Reachable directly (typed URL, back button, a link before session
  // state caught up) while already signed in - rather than silently
  // re-logging the visitor in, this hands them straight to their account
  // or an easy way out, no form in sight.
  if (isAuthenticated && user) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4 text-center">
        <span className="w-16 h-16 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
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
            <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-neutral-800 dark:text-neutral-100">
              {user.displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </span>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Você já está conectado como{" "}
          <strong className="text-neutral-900 dark:text-neutral-100">{user.displayName}</strong>.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/account"
            className="bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
          >
            Minha Conta
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="border border-neutral-300 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-900 transition-colors hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[80vh] lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-14 md:px-8">
        <div className="w-full max-w-sm">
          <Link href="/" aria-label="Scathon" className="mb-10 flex justify-center">
            <Image
              src="/branding/BrandigLogoDark.png"
              alt="Scathon"
              width={500}
              height={211}
              className="block h-8 w-auto object-contain dark:hidden"
            />
            <Image
              src="/branding/BradingLogoLigth.png"
              alt="Scathon"
              width={500}
              height={211}
              className="hidden h-8 w-auto object-contain dark:block"
            />
          </Link>

          <div className="mb-7 flex border-b border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => switchMode("entrar")}
              className={`flex-1 border-b-2 pb-3 text-xs font-semibold uppercase tracking-widest transition-colors ${
                mode === "entrar"
                  ? "border-neutral-950 text-neutral-950 dark:border-neutral-100 dark:text-neutral-100"
                  : "border-transparent text-neutral-400 hover:text-neutral-700 dark:text-neutral-600 dark:hover:text-neutral-300"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => switchMode("criar")}
              className={`flex-1 border-b-2 pb-3 text-xs font-semibold uppercase tracking-widest transition-colors ${
                mode === "criar"
                  ? "border-neutral-950 text-neutral-950 dark:border-neutral-100 dark:text-neutral-100"
                  : "border-transparent text-neutral-400 hover:text-neutral-700 dark:text-neutral-600 dark:hover:text-neutral-300"
              }`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "criar" && (
              <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
                Nome
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Seu nome"
                  className="w-full border border-neutral-300 bg-transparent px-3 py-3 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100"
                />
              </label>
            )}

            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
              E-mail
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seu@email.com"
                className="w-full border border-neutral-300 bg-transparent px-3 py-3 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
              Senha
              <input
                type="password"
                autoComplete={mode === "entrar" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full border border-neutral-300 bg-transparent px-3 py-3 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100"
              />
            </label>

            {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full bg-neutral-950 py-3.5 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-950"
            >
              {isSubmitting ? "Entrando…" : mode === "entrar" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
            {mode === "entrar" ? (
              <>
                Ainda não tem conta?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("criar")}
                  className="text-neutral-900 underline underline-offset-2 dark:text-neutral-100"
                >
                  Criar conta
                </button>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("entrar")}
                  className="text-neutral-900 underline underline-offset-2 dark:text-neutral-100"
                >
                  Entrar
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Photo panel - desktop/tablet only (`lg`+), same real photography
          already used elsewhere in the catalog rather than a stock/generic
          image, so the login screen reads as part of the same site instead
          of a bolted-on auth template. */}
      <div className="relative hidden lg:block">
        <Image
          src="/specimen/WhiteModelCathedral-T-shirt.jpeg"
          alt=""
          fill
          unoptimized
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-x-10 bottom-10 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Coleção SS26</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">Streetwear feito pra durar.</p>
        </div>
      </div>
    </div>
  );
}
