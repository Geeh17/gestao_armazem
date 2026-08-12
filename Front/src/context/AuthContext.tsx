import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { login as loginRequest, logout as logoutRequest } from "@/api/auth";
import { clearTokens, getRefreshToken, getToken, setTokens } from "@/api/client";
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
    setTokens(resultado.token, resultado.refreshToken);
    setTokenState(resultado.token);
  }, []);

  const logout = useCallback(() => {
    const refreshToken = getRefreshToken();
    // Revogação no servidor é best-effort: o usuário não deve ficar preso na
    // tela esperando a rede, nem ver erro, se a chamada falhar — os tokens já
    // saem do localStorage de qualquer forma, então a sessão local encerra.
    if (refreshToken) {
      logoutRequest(refreshToken).catch(() => {
        // Ignorado de propósito.
      });
    }

    clearTokens();
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
