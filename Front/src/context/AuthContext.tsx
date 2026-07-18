import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { login as loginRequest } from "@/api/auth";
import { clearToken, getToken, setToken } from "@/api/client";
import { decodeJwt } from "@/lib/jwt";

interface AuthContextValue {
  isAuthenticated: boolean;
  usuarioId: string | null;
  nome: string | null;
  role: string | null;
  isAdmin: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());

  const login = useCallback(async (email: string, senha: string) => {
    const resultado = await loginRequest({ email, senha });
    setToken(resultado.token);
    setTokenState(resultado.token);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const payload = token ? decodeJwt(token) : null;
    const role = payload?.role ?? null;
    return {
      isAuthenticated: token !== null,
      usuarioId: payload?.sub ?? null,
      nome: payload?.name ?? null,
      role,
      isAdmin: role === "Administrador",
      login,
      logout,
    };
  }, [token, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider.");
  }
  return context;
}
