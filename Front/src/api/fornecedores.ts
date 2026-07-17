import { apiFetch } from "./client";

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string | null;
  contato: string | null;
}

export interface CriarFornecedorRequest {
  nome: string;
  cnpj: string | null;
  contato: string | null;
}

export function listarFornecedores(): Promise<Fornecedor[]> {
  return apiFetch<Fornecedor[]>("/api/fornecedores");
}

export function criarFornecedor(dto: CriarFornecedorRequest): Promise<Fornecedor> {
  return apiFetch<Fornecedor>("/api/fornecedores", { method: "POST", body: dto });
}
