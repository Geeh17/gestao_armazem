import { apiFetch } from "./client";

export interface MovimentacaoEntradaRequest {
  produtoId: string;
  localizacaoId: string;
  quantidade: number;
  usuarioId: string;
}

export interface MovimentacaoSaidaRequest {
  produtoId: string;
  localizacaoId: string;
  quantidade: number;
  usuarioId: string;
}

export interface MovimentacaoTransferenciaRequest {
  produtoId: string;
  localizacaoOrigemId: string;
  localizacaoDestinoId: string;
  quantidade: number;
  usuarioId: string;
}

export function registrarEntrada(dto: MovimentacaoEntradaRequest): Promise<void> {
  return apiFetch<void>("/api/movimentacoes/entrada", { method: "POST", body: dto });
}

export function registrarSaida(dto: MovimentacaoSaidaRequest): Promise<void> {
  return apiFetch<void>("/api/movimentacoes/saida", { method: "POST", body: dto });
}

export function registrarTransferencia(dto: MovimentacaoTransferenciaRequest): Promise<void> {
  return apiFetch<void>("/api/movimentacoes/transferencia", { method: "POST", body: dto });
}
