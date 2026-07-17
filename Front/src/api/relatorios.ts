import { apiFetch } from "./client";

export interface EstoqueBaixo {
  produtoId: string;
  sku: string;
  nome: string;
  saldoTotal: number;
  estoqueMinimo: number;
}

export type TipoMovimentacao = "Entrada" | "Saida" | "Transferencia" | "Ajuste";

export interface MovimentacaoRelatorio {
  id: string;
  produtoId: string;
  localizacaoOrigemId: string | null;
  localizacaoDestinoId: string | null;
  quantidade: number;
  tipo: TipoMovimentacao;
  data: string;
  usuarioId: string;
}

export interface FiltroMovimentacoes {
  produtoId?: string;
  tipo?: TipoMovimentacao;
  dataInicio?: string;
  dataFim?: string;
  pagina?: number;
  tamanhoPagina?: number;
}

export function listarEstoqueBaixo(): Promise<EstoqueBaixo[]> {
  return apiFetch<EstoqueBaixo[]>("/api/relatorios/estoque-baixo");
}

export function listarMovimentacoesRelatorio(
  filtro: FiltroMovimentacoes,
): Promise<MovimentacaoRelatorio[]> {
  const params = new URLSearchParams();
  if (filtro.produtoId) params.set("produtoId", filtro.produtoId);
  if (filtro.tipo) params.set("tipo", filtro.tipo);
  if (filtro.dataInicio) params.set("dataInicio", filtro.dataInicio);
  if (filtro.dataFim) params.set("dataFim", filtro.dataFim);
  params.set("pagina", String(filtro.pagina ?? 1));
  params.set("tamanhoPagina", String(filtro.tamanhoPagina ?? 50));

  return apiFetch<MovimentacaoRelatorio[]>(`/api/relatorios/movimentacoes?${params.toString()}`);
}
