import { apiFetch } from "./client";
import type { AtualizarProdutoRequest, CriarProdutoRequest, Produto } from "@/types/produto";

export function listarProdutos(pagina = 1, tamanhoPagina = 20): Promise<Produto[]> {
  return apiFetch<Produto[]>(`/api/produtos?pagina=${pagina}&tamanhoPagina=${tamanhoPagina}`);
}

export function obterProduto(id: string): Promise<Produto> {
  return apiFetch<Produto>(`/api/produtos/${id}`);
}

export function criarProduto(dto: CriarProdutoRequest): Promise<Produto> {
  return apiFetch<Produto>("/api/produtos", { method: "POST", body: dto });
}

export function atualizarProduto(id: string, dto: AtualizarProdutoRequest): Promise<Produto> {
  return apiFetch<Produto>(`/api/produtos/${id}`, { method: "PUT", body: dto });
}

export function excluirProduto(id: string): Promise<void> {
  return apiFetch<void>(`/api/produtos/${id}`, { method: "DELETE" });
}
