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
