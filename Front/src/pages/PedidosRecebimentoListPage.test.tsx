import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("clicar em 'Próxima' busca a página seguinte", async () => {
    const listarSpy = vi.spyOn(pedidosApi, "listarPedidosRecebimento").mockResolvedValue(
      Array.from({ length: 21 }, (_, i) => ({ ...pedidos[0], id: `pedido-${i}` })),
    );
    vi.spyOn(fornecedoresApi, "listarFornecedores").mockResolvedValue(fornecedores);
    const usuario = userEvent.setup();
    renderPagina();

    await screen.findByText("Página 1");
    await usuario.click(screen.getByRole("button", { name: "Próxima" }));

    await waitFor(() => expect(listarSpy).toHaveBeenLastCalledWith(2, 21));
  });
});
