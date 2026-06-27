"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { UNAUTHORIZED_EVENT } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/auth-token";
import {
  type AuthUser,
  type LoginInput,
  type RegisterInput,
  fetchMe,
  login as loginRequest,
  register as registerRequest,
} from "@/lib/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  // On mount, hydrate the session from a stored token (if any).
  useEffect(() => {
    let active = true;

    async function hydrate(): Promise<void> {
      if (!getToken()) {
        if (active) setStatus("unauthenticated");
        return;
      }
      try {
        const me = await fetchMe();
        if (active) {
          setUser(me);
          setStatus("authenticated");
        }
      } catch {
        clearToken();
        if (active) {
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    }

    void hydrate();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const { accessToken, user: me } = await loginRequest(input);
    setToken(accessToken);
    setUser(me);
    setStatus("authenticated");
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const { accessToken, user: me } = await registerRequest(input);
    setToken(accessToken);
    setUser(me);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  // Log out when any authenticated request reports the token is no longer valid.
  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
