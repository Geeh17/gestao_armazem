import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import * as authApi from "@/api/auth";

/** Monta um JWT fake só com os claims usados pelo AuthContext. */
function montarToken(payload: Record<string, unknown>): string {
  const base64url = (obj: object) => {
    const bytesUtf8 = new TextEncoder().encode(JSON.stringify(obj));
    const binario = String.fromCharCode(...bytesUtf8);
    return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };
  return `${base64url({ alg: "HS256" })}.${base64url(payload)}.assinatura-fake`;
}

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthContext", () => {
  it("começa deslogado quando não há token no localStorage", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.usuarioId).toBeNull();
    expect(result.current.isAdmin).toBe(false);
  });

  it("login bem-sucedido autentica e expõe os claims do token", async () => {
    const token = montarToken({
      sub: "usuario-1",
      name: "Ana Gestora",
      role: "Gestor de Estoque",
    });
    vi.spyOn(authApi, "login").mockResolvedValue({ token, expiraEm: "2026-01-01T00:00:00Z" });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("ana@teste.com", "senha123");
    });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.usuarioId).toBe("usuario-1");
    expect(result.current.nome).toBe("Ana Gestora");
    expect(result.current.role).toBe("Gestor de Estoque");
    expect(result.current.isAdmin).toBe(false);
  });

  it("isAdmin só é true quando o role do token é exatamente 'Administrador'", async () => {
    const token = montarToken({ sub: "usuario-2", role: "Administrador" });
    vi.spyOn(authApi, "login").mockResolvedValue({ token, expiraEm: "2026-01-01T00:00:00Z" });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("admin@teste.com", "senha123");
    });

    await waitFor(() => expect(result.current.isAdmin).toBe(true));
  });

  it("login com credenciais inválidas propaga o erro e mantém deslogado", async () => {
    vi.spyOn(authApi, "login").mockRejectedValue(new Error("Email ou senha inválidos."));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(
      act(async () => {
        await result.current.login("errado@teste.com", "senha-errada");
      }),
    ).rejects.toThrow("Email ou senha inválidos.");

    expect(result.current.isAuthenticated).toBe(false);
  });

  it("logout limpa o estado de autenticação", async () => {
    const token = montarToken({ sub: "usuario-1", role: "Administrador" });
    vi.spyOn(authApi, "login").mockResolvedValue({ token, expiraEm: "2026-01-01T00:00:00Z" });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("admin@teste.com", "senha123");
    });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.usuarioId).toBeNull();
    expect(localStorage.getItem("gestaoarmazem:token")).toBeNull();
  });

  it("useAuth fora do AuthProvider lança erro explicativo", () => {
    // Suprime o console.error que o React imprime quando um hook lança durante o render.
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth deve ser usado dentro de um AuthProvider.",
    );

    consoleSpy.mockRestore();
  });
});
