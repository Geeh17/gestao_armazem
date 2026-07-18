import { apiFetch } from "./client";

export interface Perfil {
  id: string;
  nome: string;
}

export interface CriarPerfilRequest {
  nome: string;
}

export function listarPerfis(): Promise<Perfil[]> {
  return apiFetch<Perfil[]>("/api/perfis");
}

export function criarPerfil(dto: CriarPerfilRequest): Promise<Perfil> {
  return apiFetch<Perfil>("/api/perfis", { method: "POST", body: dto });
}
