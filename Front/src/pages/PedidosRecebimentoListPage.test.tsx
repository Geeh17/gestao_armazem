import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PedidosRecebimentoListPage } from "./PedidosRecebimentoListPage";
import * as pedidosApi from "@/api/pedidosRecebimento";
import * as fornecedoresApi from "@/api/fornecedores";
import type { PedidoRecebimento } from "@/api/pedidosRecebimento";

const fornecedores = [{ id: "fornecedor-1", nome: "Fornecedor A", cnpj: null, contato: null }];

const pedidos: PedidoRecebimento[] = [
  {
    id: "pedido-1",
    fornecedorId: "fornecedor-1",
    status: "Pendente",
    dataPrevista: "2026-06-01T00:00:00Z",
    dataRecebimento: null,
    itens: [{ id: "item-1", produtoId: "produto-1", quantidadeEsperada: 10, quantidadeRecebida: 0 }],
  },
];

function renderPagina() {
  return render(
    <MemoryRouter>
      <PedidosRecebimentoListPage />
    </MemoryRouter>,
  );
}

describe("PedidosRecebimentoListPage", () => {
  it("mostra o estado vazio quando não há pedidos", async () => {
    vi.spyOn(pedidosApi, "listarPedidosRecebimento").mockResolvedValue([]);
    vi.spyOn(fornecedoresApi, "listarFornecedores").mockResolvedValue([]);
    renderPagina();

    expect(await screen.findByText("Nenhum pedido de recebimento ainda.")).toBeInTheDocument();
  });

  it("lista os pedidos com o nome do fornecedor, quantidade de itens e status", async () => {
    vi.spyOn(pedidosApi, "listarPedidosRecebimento").mockResolvedValue(pedidos);
    vi.spyOn(fornecedoresApi, "listarFornecedores").mockResolvedValue(fornecedores);
    renderPagina();

    expect(await screen.findByText("Fornecedor A")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Pendente")).toBeInTheDocument();
  });

  it("o link de detalhe aponta para a rota certa do pedido", async () => {
    vi.spyOn(pedidosApi, "listarPedidosRecebimento").mockResolvedValue(pedidos);
    vi.spyOn(fornecedoresApi, "listarFornecedores").mockResolvedValue(fornecedores);
    renderPagina();

    const link = await screen.findByRole("link", { name: "Ver detalhes" });
    expect(link).toHaveAttribute("href", "/pedidos-recebimento/pedido-1");
  });
});
