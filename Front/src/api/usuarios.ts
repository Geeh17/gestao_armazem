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

export function listarUsuarios(): Promise<Usuario[]> {
  return apiFetch<Usuario[]>("/api/usuarios");
}

export function criarUsuario(dto: CriarUsuarioRequest): Promise<Usuario> {
  return apiFetch<Usuario>("/api/usuarios", { method: "POST", body: dto });
}
