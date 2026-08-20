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

export type StatusPedido = "Pendente" | "EmAndamento" | "Concluido" | "Cancelado";

export interface PedidoRecebimentoRelatorio {
  id: string;
  fornecedorId: string;
  fornecedorNome: string;
  status: StatusPedido;
  dataPrevista: string;
  dataRecebimento: string | null;
  quantidadeItens: number;
}

export interface PedidoExpedicaoRelatorio {
  id: string;
  clienteId: string;
  clienteNome: string;
  status: StatusPedido;
  dataPrevista: string;
  dataExpedicao: string | null;
  quantidadeItens: number;
}

export interface FiltroPedidosRecebimento {
  fornecedorId?: string;
  status?: StatusPedido;
  dataInicio?: string;
  dataFim?: string;
  pagina?: number;
  tamanhoPagina?: number;
}

export interface FiltroPedidosExpedicao {
  clienteId?: string;
  status?: StatusPedido;
  dataInicio?: string;
  dataFim?: string;
  pagina?: number;
  tamanhoPagina?: number;
}

export function listarPedidosRecebimentoRelatorio(
  filtro: FiltroPedidosRecebimento,
): Promise<PedidoRecebimentoRelatorio[]> {
  const params = new URLSearchParams();
  if (filtro.fornecedorId) params.set("fornecedorId", filtro.fornecedorId);
  if (filtro.status) params.set("status", filtro.status);
  if (filtro.dataInicio) params.set("dataInicio", filtro.dataInicio);
  if (filtro.dataFim) params.set("dataFim", filtro.dataFim);
  params.set("pagina", String(filtro.pagina ?? 1));
  params.set("tamanhoPagina", String(filtro.tamanhoPagina ?? 50));

  return apiFetch<PedidoRecebimentoRelatorio[]>(`/api/relatorios/pedidos-recebimento?${params.toString()}`);
}

export function listarPedidosExpedicaoRelatorio(
  filtro: FiltroPedidosExpedicao,
): Promise<PedidoExpedicaoRelatorio[]> {
  const params = new URLSearchParams();
  if (filtro.clienteId) params.set("clienteId", filtro.clienteId);
  if (filtro.status) params.set("status", filtro.status);
  if (filtro.dataInicio) params.set("dataInicio", filtro.dataInicio);
  if (filtro.dataFim) params.set("dataFim", filtro.dataFim);
  params.set("pagina", String(filtro.pagina ?? 1));
  params.set("tamanhoPagina", String(filtro.tamanhoPagina ?? 50));

  return apiFetch<PedidoExpedicaoRelatorio[]>(`/api/relatorios/pedidos-expedicao?${params.toString()}`);
}
