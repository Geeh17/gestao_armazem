import { apiFetch } from "./client";

export interface ItemPedidoRecebimento {
  id: string;
  produtoId: string;
  quantidadeEsperada: number;
  quantidadeRecebida: number;
}

export interface PedidoRecebimento {
  id: string;
  fornecedorId: string;
  status: "Pendente" | "EmAndamento" | "Concluido" | "Cancelado";
  dataPrevista: string;
  dataRecebimento: string | null;
  itens: ItemPedidoRecebimento[];
}

export interface CriarPedidoRecebimentoRequest {
  fornecedorId: string;
  dataPrevista: string;
  itens: { produtoId: string; quantidadeEsperada: number }[];
}

export interface ConfirmarRecebimentoItemRequest {
  quantidadeRecebida: number;
  localizacaoId: string;
  usuarioId: string;
}

export function listarPedidosRecebimento(pagina = 1, tamanhoPagina = 20): Promise<PedidoRecebimento[]> {
  return apiFetch<PedidoRecebimento[]>(
    `/api/pedidos-recebimento?pagina=${pagina}&tamanhoPagina=${tamanhoPagina}`,
  );
}

export function obterPedidoRecebimento(id: string): Promise<PedidoRecebimento> {
  return apiFetch<PedidoRecebimento>(`/api/pedidos-recebimento/${id}`);
}

export function criarPedidoRecebimento(dto: CriarPedidoRecebimentoRequest): Promise<PedidoRecebimento> {
  return apiFetch<PedidoRecebimento>("/api/pedidos-recebimento", { method: "POST", body: dto });
}

export function confirmarRecebimentoItem(
  pedidoId: string,
  itemId: string,
  dto: ConfirmarRecebimentoItemRequest,
): Promise<void> {
  return apiFetch<void>(`/api/pedidos-recebimento/${pedidoId}/itens/${itemId}/confirmar-recebimento`, {
    method: "POST",
    body: dto,
  });
}
