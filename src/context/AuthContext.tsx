"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { User } from "@/types";
import { createPersistedStore } from "@/lib/createPersistedStore";
import { SESSION_EXPIRED_EVENT } from "@/lib/apiClient";

interface AuthSession {
  token: string | null;
  user: User | null;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
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
// `token` é o JWT de verdade emitido por `POST /api/v1/auth/login` no
// backend Flask (`scathon-api`), válido por 12h (mesma janela do cookie de
// `/admin` - ver `JWT_TTL_HOURS` em `app/auth/jwt_utils.py`), e `user` vem
// de `User.to_public_dict()` - nenhum dos dois é mais inventado aqui.
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
  useEffect(() => {
    function handleSessionExpired() {
      authStore.setValue(EMPTY_SESSION);
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
