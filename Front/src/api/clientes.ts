import { apiFetch } from "./client";

export interface Cliente {
  id: string;
  nome: string;
  documento: string | null;
  contato: string | null;
}

export interface CriarClienteRequest {
  nome: string;
  documento: string | null;
  contato: string | null;
}

export function listarClientes(): Promise<Cliente[]> {
  return apiFetch<Cliente[]>("/api/clientes");
}

export function criarCliente(dto: CriarClienteRequest): Promise<Cliente> {
  return apiFetch<Cliente>("/api/clientes", { method: "POST", body: dto });
}
