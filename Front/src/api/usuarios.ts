import { apiFetch } from "./client";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfilId: string;
  perfilNome: string;
}

export interface CriarUsuarioRequest {
  nome: string;
  email: string;
  senha: string;
  perfilId: string;
}

export interface AtualizarUsuarioRequest {
  nome: string;
  email: string;
  perfilId: string;
}

export function listarUsuarios(): Promise<Usuario[]> {
  return apiFetch<Usuario[]>("/api/usuarios");
}

export function criarUsuario(dto: CriarUsuarioRequest): Promise<Usuario> {
  return apiFetch<Usuario>("/api/usuarios", { method: "POST", body: dto });
}

export function atualizarUsuario(id: string, dto: AtualizarUsuarioRequest): Promise<Usuario> {
  return apiFetch<Usuario>(`/api/usuarios/${id}`, { method: "PUT", body: dto });
}

export function excluirUsuario(id: string): Promise<void> {
  return apiFetch<void>(`/api/usuarios/${id}`, { method: "DELETE" });
}

/** Administrador redefine a senha de outro usuário (sem exigir a senha atual). */
export function resetarSenhaUsuario(id: string, novaSenha: string): Promise<void> {
  return apiFetch<void>(`/api/usuarios/${id}/resetar-senha`, {
    method: "POST",
    body: { novaSenha },
  });
}
