"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/types";
import { createPersistedStore } from "@/lib/createPersistedStore";
import { apiFetch, SESSION_EXPIRED_EVENT } from "@/lib/apiClient";

interface AuthSession {
  /**
   * Apesar do nome (mantido assim em todo o app por compatibilidade - dezenas
   * de funções em `@/lib/*` recebem isto como `token`), este valor NÃO é mais
   * o JWT desde a medida de segurança de 2026-10-11 - é o `csrfToken` que
   * `@/lib/auth` devolve no login/registro/troca de senha. Ver o doc comment
   * logo abaixo pro porquê da mudança.
   */
  token: string | null;
  user: User | null;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  /**
   * `token` aqui é o `csrfToken` de `@/lib/auth` (ver `AuthSession` acima),
   * NUNCA o JWT que essas mesmas respostas também devolvem - `<LoginView/>`
   * usa o JWT de forma transitória (pra abrir o cookie de `/admin`) e passa
   * só o `csrfToken` pra cá.
   */
  login: (token: string, user: User) => void;
  logout: () => void;
  /**
   * Atualiza só o `user` da sessão (mantém o mesmo `token`) - usado depois de
   * um `PATCH /me`/upload de avatar bem-sucedido (ver `<AccountEditView/>`),
   * pra refletir os novos dados na hora sem precisar logar de novo.
   */
  updateUser: (user: User) => void;
}

const EMPTY_SESSION: AuthSession = { token: null, user: null };

// Real session now (ver `@/lib/auth`'s `loginRequest`/`registerRequest`):
// `user` vem de `User.to_public_dict()` - não é mais inventado aqui.
//
// MEDIDA DE SEGURANÇA (Alfredo, 2026-10-11): até aqui, `token` guardava o
// JWT de verdade em `localStorage` (via `createPersistedStore` abaixo), lido
// por `@/lib/apiClient` e mandado como `Authorization: Bearer` em toda
// chamada. O problema não era a expiração (já existia - 12h, ver
// `JWT_TTL_HOURS` em `app/auth/jwt_utils.py`), era ONDE o token ficava:
// `localStorage` é legível por qualquer JavaScript da página, então uma
// falha de XSS em QUALQUER lugar do site bastaria pra roubar a sessão de
// qualquer cliente logado. Agora o JWT de verdade vive só num cookie
// `httpOnly` que o backend grava sozinho (`Set-Cookie`) - nenhum JavaScript
// consegue ler esse valor. `token`, aqui, virou só o valor de CSRF
// (`csrfToken` de `@/lib/auth`) - inofensivo sozinho (não autentica nada,
// só prova "esta chamada veio do nosso próprio frontend" - ver doc comment
// de `@/lib/apiClient`), por isso pode continuar em `localStorage` sem
// reabrir o mesmo risco.
//
// `EMPTY_SESSION` é o default de propósito: um visitante novo chega
// DESLOGADO, como em qualquer app de verdade. Antes disso existir, essa
// store começava com uma sessão mockada (`MOCK_SESSION`/`MOCK_CUSTOMER`,
// construída a partir de `@/lib/accounts`) só pra UI ter uma foto/avatar
// bonita pra mostrar antes do backend existir - isso foi removido junto com
// aquele arquivo. Todo componente que lê `useAuth()` já trata `user: null`/
// `isAuthenticated: false` corretamente (`<UserAvatar/>`, `<DrawerMenu/>`,
// `<AccountView/>`, `<NotifyMeButton/>`...), então não sobrou nenhum lugar
// assumindo "sempre tem alguém logado".
const authStore = createPersistedStore<AuthSession>("scathon:session", EMPTY_SESSION);

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);
  const sessionExpiredNoticeRef = useRef(false);
  const redirectTimerRef = useRef<number | null>(null);

  const session = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getServerSnapshot,
  );

  const login = useCallback((token: string, user: User) => {
    authStore.setValue({ token, user });
  }, []);

  const updateUser = useCallback((user: User) => {
    authStore.setValue((current) =>
      current.token ? { token: current.token, user } : current,
    );
  }, []);

  const logout = useCallback(() => {
    authStore.setValue(EMPTY_SESSION);
    // Also clears the real, signed `/admin` session cookie (see
    // `POST /api/auth/logout`, `@/lib/session`, `src/proxy.ts`) - fired and
    // forgotten rather than awaited, since `logout()` is called from plain
    // click handlers all over the app (`<DrawerMenu/>`, `<AccountView/>`,
    // `<AdminHeader/>`...) that don't expect a promise back, and the local
    // session above is what those screens actually react to right away.
    if (typeof window !== "undefined") {
      fetch("/api/auth/logout", { method: "POST" }).catch(() => {
        // Offline/network hiccup: worst case the cookie outlives this
        // logout until it naturally expires (12h, see `SESSION_TTL_SECONDS`)
        // - it still never grants anything beyond what a fresh login to the
        // same account would.
      });
      // MEDIDA DE SEGURANÇA (2026-10-11): também limpa o cookie httpOnly
      // `scathon_access_token` do backend Flask (`POST /api/v1/auth/logout`,
      // ver `app/auth/jwt_utils.py`'s `clear_session_cookie`) - sem isso,
      // limpar só o `localStorage` acima deixaria esse cookie vivo e
      // autenticando normalmente até as 12h naturais, mesmo com a UI já
      // mostrando "deslogado" (importante sobretudo em computador
      // compartilhado). Também fire-and-forget, mesmo motivo acima.
      apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    }
  }, []);

  // Sessão local com token morto (expirado, ou de um segredo/DB que o
  // backend não reconhece mais) - ver o doc comment de `SESSION_EXPIRED_EVENT`
  // em `@/lib/apiClient`. Sem isso, um token inválido deixava o app
  // "logado" na aparência (token/user ainda presentes aqui) enquanto toda
  // chamada autenticada quebrava por baixo - cada hook descobrindo isso do
  // seu próprio jeito, às vezes nem tratando o erro (foi o que aconteceu com
  // `useSavedAddresses`/`useInventory`). Limpar a sessão aqui, central,
  // garante que o app inteiro reage do mesmo jeito (volta a mostrar "entrar")
  // não importa qual tela foi a primeira a bater no 401.
  const goToLogin = useCallback(() => {
    if (redirectTimerRef.current !== null) {
      window.clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    sessionExpiredNoticeRef.current = false;
    setSessionExpiredNotice(false);
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    function handleSessionExpired() {
      if (sessionExpiredNoticeRef.current) return;
      sessionExpiredNoticeRef.current = true;
      // Reuse the normal logout path so both the client session and the
      // httpOnly backend cookie are cleared. The request is best-effort and
      // must not delay the local cleanup or the redirect.
      logout();
      setSessionExpiredNotice(true);
      redirectTimerRef.current = window.setTimeout(goToLogin, 2200);
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [goToLogin, logout]);

  useEffect(() => () => {
    if (redirectTimerRef.current !== null) window.clearTimeout(redirectTimerRef.current);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session.user,
      token: session.token,
      isAuthenticated: Boolean(session.token && session.user),
      isAdmin: session.user?.role === "admin",
      login,
      logout,
      updateUser,
    }),
    [session, login, logout, updateUser],
  );

  return (
    <>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
      {sessionExpiredNotice && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="session-expired-title"
          aria-describedby="session-expired-description"
        >
          <div className="w-full max-w-md rounded-app border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-700 dark:bg-neutral-950">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
              Segurança da conta
            </p>
            <h2 id="session-expired-title" className="mt-2 text-xl font-semibold text-neutral-950 dark:text-white">
              Sua sessão expirou
            </h2>
            <p id="session-expired-description" className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
              Por segurança, sua sessão foi encerrada. Você será redirecionado para entrar novamente.
            </p>
            <button
              type="button"
              onClick={goToLogin}
              className="mt-6 w-full rounded-app bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
            >
              Ir para o login
            </button>
          </div>
        </div>
      )}
    </>
  );
}

