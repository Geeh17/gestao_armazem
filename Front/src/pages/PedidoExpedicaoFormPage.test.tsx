import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PedidoExpedicaoFormPage } from "./PedidoExpedicaoFormPage";
import * as clientesApi from "@/api/clientes";
import * as produtosApi from "@/api/produtos";
import * as pedidosApi from "@/api/pedidosExpedicao";
import { ApiError } from "@/api/client";
import type { Produto } from "@/types/produto";
import type { PedidoExpedicao } from "@/api/pedidosExpedicao";

const clientes = [{ id: "cliente-1", nome: "Cliente A", documento: null, contato: null }];

const produtos: Produto[] = [
  { id: "produto-1", sku: "SKU-1", nome: "Produto 1", descricao: null, categoriaId: "cat-1", unidadeMedida: "UN", codigoBarras: null, estoqueMinimo: 0 },
];

function mockarCarregamentoInicial() {
  vi.spyOn(clientesApi, "listarClientes").mockResolvedValue(clientes);
  vi.spyOn(produtosApi, "listarProdutos").mockResolvedValue(produtos);
}

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={["/pedidos-expedicao/novo"]}>
      <Routes>
        <Route path="/pedidos-expedicao" element={<div>Lista de pedidos</div>} />
        <Route path="/pedidos-expedicao/novo" element={<PedidoExpedicaoFormPage />} />
        <Route path="/pedidos-expedicao/:id" element={<div>Detalhe do pedido criado</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PedidoExpedicaoFormPage", () => {
  it("adiciona e remove linhas de item dinamicamente", async () => {
    mockarCarregamentoInicial();
    const usuario = userEvent.setup();
    renderPagina();

    await waitFor(() => expect(screen.getAllByLabelText("Produto")).toHaveLength(1));

    await usuario.click(screen.getByRole("button", { name: "+ Adicionar item" }));
    expect(screen.getAllByLabelText("Produto")).toHaveLength(2);

    await usuario.click(screen.getAllByRole("button", { name: "Remover" })[0]);
    expect(screen.getAllByLabelText("Produto")).toHaveLength(1);
  });

  it("submete o pedido com cliente, data e itens, e navega para o detalhe criado", async () => {
    mockarCarregamentoInicial();
    vi.spyOn(pedidosApi, "criarPedidoExpedicao").mockResolvedValue({
      id: "pedido-expedicao-novo",
    } as PedidoExpedicao);
    const usuario = userEvent.setup();
    renderPagina();

    await waitFor(() => expect(screen.getAllByLabelText("Produto")).toHaveLength(1));

    await usuario.type(screen.getByLabelText("Data prevista"), "2026-06-10");
    await usuario.clear(screen.getByLabelText("Qtd. solicitada"));
    await usuario.type(screen.getByLabelText("Qtd. solicitada"), "7");
    await usuario.click(screen.getByRole("button", { name: "Criar pedido" }));

    await waitFor(() => expect(screen.getByText("Detalhe do pedido criado")).toBeInTheDocument());

    expect(pedidosApi.criarPedidoExpedicao).toHaveBeenCalledWith({
      clienteId: "cliente-1",
      dataPrevista: "2026-06-10",
      itens: [{ produtoId: "produto-1", quantidadeSolicitada: 7 }],
    });
  });

  it("mostra o erro da API e não navega quando falha ao criar o pedido", async () => {
    mockarCarregamentoInicial();
    vi.spyOn(pedidosApi, "criarPedidoExpedicao").mockRejectedValue(
      new ApiError("Cliente inválido.", 400),
    );
    const usuario = userEvent.setup();
    renderPagina();

    await waitFor(() => expect(screen.getAllByLabelText("Produto")).toHaveLength(1));
    await usuario.type(screen.getByLabelText("Data prevista"), "2026-06-10");
    await usuario.click(screen.getByRole("button", { name: "Criar pedido" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Cliente inválido.");
    expect(screen.queryByText("Detalhe do pedido criado")).not.toBeInTheDocument();
  });
});
