import { apiFetch } from "./client";
import type { CriarProdutoRequest, Produto } from "@/types/produto";

export function listarProdutos(pagina = 1, tamanhoPagina = 20): Promise<Produto[]> {
  return apiFetch<Produto[]>(`/api/produtos?pagina=${pagina}&tamanhoPagina=${tamanhoPagina}`);
}

export function obterProduto(id: string): Promise<Produto> {
  return apiFetch<Produto>(`/api/produtos/${id}`);
}

export function criarProduto(dto: CriarProdutoRequest): Promise<Produto> {
  return apiFetch<Produto>("/api/produtos", { method: "POST", body: dto });
}
