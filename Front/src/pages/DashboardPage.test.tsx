import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";
import * as produtosApi from "@/api/produtos";
import * as pedidosRecebimentoApi from "@/api/pedidosRecebimento";
import * as pedidosExpedicaoApi from "@/api/pedidosExpedicao";
import type { PedidoRecebimento } from "@/api/pedidosRecebimento";
import type { PedidoExpedicao } from "@/api/pedidosExpedicao";
import type { Produto } from "@/types/produto";

const produtos: Produto[] = [
  { id: "produto-1", sku: "SKU-1", nome: "Produto 1", descricao: null, categoriaId: "cat-1", unidadeMedida: "UN", codigoBarras: null, estoqueMinimo: 0 },
];

function pedidoRecebimento(status: PedidoRecebimento["status"]): PedidoRecebimento {
  return {
    id: `pedido-${status}`,
    fornecedorId: "fornecedor-1",
    status,
    dataPrevista: "2026-06-01T00:00:00Z",
    dataRecebimento: null,
    itens: [{ id: "item-1", produtoId: "produto-1", quantidadeEsperada: 5, quantidadeRecebida: 0 }],
  };
}

function pedidoExpedicao(status: PedidoExpedicao["status"]): PedidoExpedicao {
  return {
    id: `pedido-exp-${status}`,
    clienteId: "cliente-1",
    status,
    dataPrevista: "2026-06-01T00:00:00Z",
    dataExpedicao: null,
    itens: [{ id: "item-1", produtoId: "produto-1", quantidadeSolicitada: 5, quantidadeExpedida: 0 }],
  };
}

function renderPagina() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe("DashboardPage", () => {
  it("mostra a contagem de produtos e só os pedidos em aberto (Pendente/EmAndamento)", async () => {
    vi.spyOn(produtosApi, "listarProdutos").mockResolvedValue(produtos);
    vi.spyOn(pedidosRecebimentoApi, "listarPedidosRecebimento").mockResolvedValue([
      pedidoRecebimento("Pendente"),
      pedidoRecebimento("EmAndamento"),
      pedidoRecebimento("Concluido"),
      pedidoRecebimento("Cancelado"),
    ]);
    vi.spyOn(pedidosExpedicaoApi, "listarPedidosExpedicao").mockResolvedValue([
      pedidoExpedicao("Pendente"),
    ]);
    renderPagina();

    // "1" e "2" aparecem em mais de um card — busca pelo card específico via o rótulo.
    expect(await screen.findByText("Produtos cadastrados")).toBeInTheDocument();
    const cardProdutos = screen.getByText("Produtos cadastrados").closest("a");
    const cardRecebimentos = screen.getByText("Recebimentos em aberto").closest("a");
    const cardExpedicoes = screen.getByText("Expedições em aberto").closest("a");

    expect(cardProdutos).toHaveTextContent("1");
    expect(cardRecebimentos).toHaveTextContent("2");
    expect(cardExpedicoes).toHaveTextContent("1");
  });

  it("mostra a mensagem de vazio quando não há pedidos pendentes", async () => {
    vi.spyOn(produtosApi, "listarProdutos").mockResolvedValue([]);
    vi.spyOn(pedidosRecebimentoApi, "listarPedidosRecebimento").mockResolvedValue([]);
    vi.spyOn(pedidosExpedicaoApi, "listarPedidosExpedicao").mockResolvedValue([]);
    renderPagina();

    expect(await screen.findByText("Nenhum recebimento pendente no momento.")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma expedição pendente no momento.")).toBeInTheDocument();
  });

  it("mostra o erro quando o carregamento do resumo falha", async () => {
    vi.spyOn(produtosApi, "listarProdutos").mockRejectedValue(new Error("falha de rede"));
    vi.spyOn(pedidosRecebimentoApi, "listarPedidosRecebimento").mockResolvedValue([]);
    vi.spyOn(pedidosExpedicaoApi, "listarPedidosExpedicao").mockResolvedValue([]);
    renderPagina();

    expect(await screen.findByText("Não foi possível carregar o resumo do armazém.")).toBeInTheDocument();
  });

  it("tem os atalhos rápidos para as ações mais comuns", async () => {
    vi.spyOn(produtosApi, "listarProdutos").mockResolvedValue([]);
    vi.spyOn(pedidosRecebimentoApi, "listarPedidosRecebimento").mockResolvedValue([]);
    vi.spyOn(pedidosExpedicaoApi, "listarPedidosExpedicao").mockResolvedValue([]);
    renderPagina();

    await screen.findByText("Nenhum recebimento pendente no momento.");

    expect(screen.getByRole("link", { name: "+ Novo produto" })).toHaveAttribute("href", "/produtos/novo");
    expect(screen.getByRole("link", { name: "+ Registrar movimentação" })).toHaveAttribute(
      "href",
      "/movimentacoes",
    );
  });
});
