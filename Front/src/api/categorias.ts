import { apiFetch } from "./client";

export interface Categoria {
  id: string;
  nome: string;
}

export function listarCategorias(): Promise<Categoria[]> {
  return apiFetch<Categoria[]>("/api/categorias");
}

export function criarCategoria(dto: { nome: string }): Promise<Categoria> {
  return apiFetch<Categoria>("/api/categorias", { method: "POST", body: dto });
}

export function atualizarCategoria(id: string, dto: { nome: string }): Promise<Categoria> {
  return apiFetch<Categoria>(`/api/categorias/${id}`, { method: "PUT", body: dto });
}

export function excluirCategoria(id: string): Promise<void> {
  return apiFetch<void>(`/api/categorias/${id}`, { method: "DELETE" });
}
