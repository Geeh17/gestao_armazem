import { apiFetch } from "./client";

export interface Localizacao {
  id: string;
  armazemId: string;
  corredor: string;
  prateleira: string;
  nivel: string;
  codigo: string;
}

export interface CriarLocalizacaoRequest {
  armazemId: string;
  corredor: string;
  prateleira: string;
  nivel: string;
  codigo: string;
}

export function listarLocalizacoes(): Promise<Localizacao[]> {
  return apiFetch<Localizacao[]>("/api/localizacoes");
}

export function criarLocalizacao(dto: CriarLocalizacaoRequest): Promise<Localizacao> {
  return apiFetch<Localizacao>("/api/localizacoes", { method: "POST", body: dto });
}
