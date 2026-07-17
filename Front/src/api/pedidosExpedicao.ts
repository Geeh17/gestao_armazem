import { apiFetch } from "./client";

export interface ItemPedidoExpedicao {
  id: string;
  produtoId: string;
  quantidadeSolicitada: number;
  quantidadeExpedida: number;
}

export interface PedidoExpedicao {
  id: string;
  clienteId: string;
  status: "Pendente" | "EmAndamento" | "Concluido" | "Cancelado";
  dataPrevista: string;
  dataExpedicao: string | null;
  itens: ItemPedidoExpedicao[];
}

export interface CriarPedidoExpedicaoRequest {
  clienteId: string;
  dataPrevista: string;
  itens: { produtoId: string; quantidadeSolicitada: number }[];
}

export interface ExpedirPedidoRequest {
  itens: { itemId: string; localizacaoId: string }[];
  usuarioId: string;
}

export function listarPedidosExpedicao(pagina = 1, tamanhoPagina = 20): Promise<PedidoExpedicao[]> {
  return apiFetch<PedidoExpedicao[]>(
    `/api/pedidos-expedicao?pagina=${pagina}&tamanhoPagina=${tamanhoPagina}`,
  );
}

export function obterPedidoExpedicao(id: string): Promise<PedidoExpedicao> {
  return apiFetch<PedidoExpedicao>(`/api/pedidos-expedicao/${id}`);
}

export function criarPedidoExpedicao(dto: CriarPedidoExpedicaoRequest): Promise<PedidoExpedicao> {
  return apiFetch<PedidoExpedicao>("/api/pedidos-expedicao", { method: "POST", body: dto });
}

export function expedirPedido(pedidoId: string, dto: ExpedirPedidoRequest): Promise<void> {
  return apiFetch<void>(`/api/pedidos-expedicao/${pedidoId}/expedir`, { method: "POST", body: dto });
}
