import { apiFetch } from "./client";

export interface Categoria {
  id: string;
  nome: string;
}

export function listarCategorias(): Promise<Categoria[]> {
  return apiFetch<Categoria[]>("/api/categorias");
}
