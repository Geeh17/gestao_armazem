import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PedidosExpedicaoListPage } from "./PedidosExpedicaoListPage";
import * as pedidosApi from "@/api/pedidosExpedicao";
import * as clientesApi from "@/api/clientes";
import type { PedidoExpedicao } from "@/api/pedidosExpedicao";

const clientes = [{ id: "cliente-1", nome: "Cliente A", documento: null, contato: null }];

const pedidos: PedidoExpedicao[] = [
  {
    id: "pedido-1",
    clienteId: "cliente-1",
    status: "EmAndamento",
    dataPrevista: "2026-06-01T00:00:00Z",
    dataExpedicao: null,
    itens: [{ id: "item-1", produtoId: "produto-1", quantidadeSolicitada: 5, quantidadeExpedida: 2 }],
  },
];

function renderPagina() {
  return render(
    <MemoryRouter>
      <PedidosExpedicaoListPage />
    </MemoryRouter>,
  );
}

describe("PedidosExpedicaoListPage", () => {
  it("mostra o estado vazio quando não há pedidos", async () => {
    vi.spyOn(pedidosApi, "listarPedidosExpedicao").mockResolvedValue([]);
    vi.spyOn(clientesApi, "listarClientes").mockResolvedValue([]);
    renderPagina();

    expect(await screen.findByText("Nenhum pedido de expedição ainda.")).toBeInTheDocument();
  });

  it("lista os pedidos com o nome do cliente e o status traduzido", async () => {
    vi.spyOn(pedidosApi, "listarPedidosExpedicao").mockResolvedValue(pedidos);
    vi.spyOn(clientesApi, "listarClientes").mockResolvedValue(clientes);
    renderPagina();

    expect(await screen.findByText("Cliente A")).toBeInTheDocument();
    expect(screen.getByText("Em andamento")).toBeInTheDocument();
  });

  it("o link de detalhe aponta para a rota certa do pedido", async () => {
    vi.spyOn(pedidosApi, "listarPedidosExpedicao").mockResolvedValue(pedidos);
    vi.spyOn(clientesApi, "listarClientes").mockResolvedValue(clientes);
    renderPagina();

    const link = await screen.findByRole("link", { name: "Ver detalhes" });
    expect(link).toHaveAttribute("href", "/pedidos-expedicao/pedido-1");
  });
});
