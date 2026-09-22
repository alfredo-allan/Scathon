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

// Mock customer identity - the *default* (pre-login) session below uses it
// so <UserAvatar/> - in the header and in <FloatingDock/> - previews its
// real end state (an actual photo) instead of the generic sign-in glyph,
// before real accounts/auth exist. Exported (not just used inline) so
// `/login`'s mock sign-in/sign-up form (`<LoginView/>`) can build on the
// same identity instead of inventing a second one - the avatar photo in
// particular stays consistent with what the rest of the app already shows.
export const MOCK_CUSTOMER: User = {
  id: "mock-user",
  displayName: "Cliente Scathon",
  email: "cliente@scathon.com",
  // Real avatar asset (`public/avatar.jpg`) rather than the generated
  // initials-circle placeholder - wherever this mock identity's photo
  // shows up (header, floating dock, /login's "already signed in" state,
  // /account), it's now the actual brand avatar instead of a stand-in.
  avatarUrl: "/avatar.jpg",
  role: "customer",
};

// This is only the fallback: it's what a fresh browser sees before any
// explicit login/logout persists a real value to localStorage. Calling
// `logout()` still writes a real `EMPTY_SESSION` (token: null, user: null)
// so the signed-out state - and `/login`'s actual sign-in form - can still
// be reached and tested on demand. Delete this mock and go back to
// `EMPTY_SESSION` as the default once there's a real backend session to
// check on load instead.
const MOCK_SESSION: AuthSession = {
  token: "mock-token",
  user: MOCK_CUSTOMER,
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
