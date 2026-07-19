import { apiFetch } from "./client";

export interface Armazem {
  id: string;
  nome: string;
  endereco: string | null;
}

export interface CriarArmazemRequest {
  nome: string;
  endereco: string | null;
}

export function listarArmazens(): Promise<Armazem[]> {
  return apiFetch<Armazem[]>("/api/armazens");
}

export function criarArmazem(dto: CriarArmazemRequest): Promise<Armazem> {
  return apiFetch<Armazem>("/api/armazens", { method: "POST", body: dto });
}

export function atualizarArmazem(id: string, dto: CriarArmazemRequest): Promise<Armazem> {
  return apiFetch<Armazem>(`/api/armazens/${id}`, { method: "PUT", body: dto });
}

export function excluirArmazem(id: string): Promise<void> {
  return apiFetch<void>(`/api/armazens/${id}`, { method: "DELETE" });
}
