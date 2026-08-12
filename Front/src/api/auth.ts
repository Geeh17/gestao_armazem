import { apiFetch } from "./client";
import type { LoginRequest, TokenResponse } from "@/types/auth";

export function login(dto: LoginRequest): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: dto,
    auth: false,
  });
}

/** Renova o access token usando o refresh token — não exige Bearer (a sessão pode ter expirado). */
export function refresh(refreshToken: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/api/auth/refresh", {
    method: "POST",
    body: { refreshToken },
    auth: false,
  });
}

/** Revoga o refresh token no servidor — encerra a sessão nesse dispositivo. */
export function logout(refreshToken: string): Promise<void> {
  return apiFetch<void>("/api/auth/logout", {
    method: "POST",
    body: { refreshToken },
    auth: false,
  });
}

export interface AlterarSenhaRequest {
  senhaAtual: string;
  novaSenha: string;
}

export function alterarSenha(dto: AlterarSenhaRequest): Promise<void> {
  return apiFetch<void>("/api/auth/alterar-senha", { method: "POST", body: dto });
}
