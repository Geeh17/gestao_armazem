import { apiFetch } from "./client";

export interface SaldoEstoque {
  produtoId: string;
  localizacaoId: string;
  quantidade: number;
}

export function consultarEstoquePorProduto(produtoId: string): Promise<SaldoEstoque[]> {
  return apiFetch<SaldoEstoque[]>(`/api/estoque?produtoId=${produtoId}`);
}
