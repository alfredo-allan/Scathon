"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { User } from "@/types";
import { createPersistedStore } from "@/lib/createPersistedStore";
import { placeholderAvatar } from "@/lib/placeholder";

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
}

const EMPTY_SESSION: AuthSession = { token: null, user: null };

// Mock signed-in session used as the *default* (pre-login) state so
// <UserAvatar/> - in the header and in <FloatingDock/> - previews its
// real end state (an actual photo) instead of the generic sign-in glyph,
// before real accounts/auth exist. This is only the fallback: it's what
// a fresh browser sees before any explicit login/logout persists a real
// value to localStorage. Calling `logout()` still writes a real
// `EMPTY_SESSION` (token: null, user: null) so the signed-out state - and
// the header's actual sign-in link - can still be tested on demand.
// Delete this mock and go back to `EMPTY_SESSION` as the default once a
// real login flow exists.
const MOCK_SESSION: AuthSession = {
  token: "mock-token",
  user: {
    id: "mock-user",
    displayName: "Cliente Scathon",
    email: "cliente@scathon.com",
    avatarUrl: placeholderAvatar(),
    role: "customer",
  },
};

const authStore = createPersistedStore<AuthSession>("scathon:session", MOCK_SESSION);

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

  const logout = useCallback(() => {
    authStore.setValue(EMPTY_SESSION);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session.user,
      token: session.token,
      isAuthenticated: Boolean(session.token && session.user),
      isAdmin: session.user?.role === "admin",
      login,
      logout,
    }),
    [session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
