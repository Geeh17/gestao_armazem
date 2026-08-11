import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PedidoRecebimentoFormPage } from "./PedidoRecebimentoFormPage";
import * as fornecedoresApi from "@/api/fornecedores";
import * as produtosApi from "@/api/produtos";
import * as pedidosApi from "@/api/pedidosRecebimento";
import { ApiError } from "@/api/client";
import type { Produto } from "@/types/produto";
import type { PedidoRecebimento } from "@/api/pedidosRecebimento";

const fornecedores = [{ id: "fornecedor-1", nome: "Fornecedor A", cnpj: null, contato: null }];

const produtos: Produto[] = [
  { id: "produto-1", sku: "SKU-1", nome: "Produto 1", descricao: null, categoriaId: "cat-1", unidadeMedida: "UN", codigoBarras: null, estoqueMinimo: 0 },
  { id: "produto-2", sku: "SKU-2", nome: "Produto 2", descricao: null, categoriaId: "cat-1", unidadeMedida: "UN", codigoBarras: null, estoqueMinimo: 0 },
];

function mockarCarregamentoInicial() {
  vi.spyOn(fornecedoresApi, "listarFornecedores").mockResolvedValue(fornecedores);
  vi.spyOn(produtosApi, "listarProdutos").mockResolvedValue(produtos);
}

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={["/pedidos-recebimento/novo"]}>
      <Routes>
        <Route path="/pedidos-recebimento" element={<div>Lista de pedidos</div>} />
        <Route path="/pedidos-recebimento/novo" element={<PedidoRecebimentoFormPage />} />
        <Route path="/pedidos-recebimento/:id" element={<div>Detalhe do pedido criado</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PedidoRecebimentoFormPage", () => {
  it("começa com um item, e '+ Adicionar item' cria uma segunda linha", async () => {
    mockarCarregamentoInicial();
    const usuario = userEvent.setup();
    renderPagina();

    await waitFor(() => expect(screen.getAllByLabelText("Produto")).toHaveLength(1));

    await usuario.click(screen.getByRole("button", { name: "+ Adicionar item" }));

    expect(screen.getAllByLabelText("Produto")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Remover" })).toHaveLength(2);
  });

  it("'Remover' some quando resta só um item, e some a linha corretamente", async () => {
    mockarCarregamentoInicial();
    const usuario = userEvent.setup();
    renderPagina();

    await waitFor(() => expect(screen.getAllByLabelText("Produto")).toHaveLength(1));
    expect(screen.queryByRole("button", { name: "Remover" })).not.toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "+ Adicionar item" }));
    expect(screen.getAllByLabelText("Produto")).toHaveLength(2);

    await usuario.click(screen.getAllByRole("button", { name: "Remover" })[0]);

    expect(screen.getAllByLabelText("Produto")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Remover" })).not.toBeInTheDocument();
  });

  it("submete o pedido com fornecedor, data e itens, e navega para o detalhe criado", async () => {
    mockarCarregamentoInicial();
    vi.spyOn(pedidosApi, "criarPedidoRecebimento").mockResolvedValue({
      id: "pedido-novo",
    } as PedidoRecebimento);
    const usuario = userEvent.setup();
    renderPagina();

    await waitFor(() => expect(screen.getAllByLabelText("Produto")).toHaveLength(1));

    await usuario.type(screen.getByLabelText("Data prevista"), "2026-06-01");
    await usuario.clear(screen.getByLabelText("Qtd. esperada"));
    await usuario.type(screen.getByLabelText("Qtd. esperada"), "10");
    await usuario.click(screen.getByRole("button", { name: "Criar pedido" }));

    await waitFor(() => expect(screen.getByText("Detalhe do pedido criado")).toBeInTheDocument());

    expect(pedidosApi.criarPedidoRecebimento).toHaveBeenCalledWith({
      fornecedorId: "fornecedor-1",
      dataPrevista: "2026-06-01",
      itens: [{ produtoId: "produto-1", quantidadeEsperada: 10 }],
    });
  });

  it("mostra o erro da API e não navega quando falha ao criar o pedido", async () => {
    mockarCarregamentoInicial();
    vi.spyOn(pedidosApi, "criarPedidoRecebimento").mockRejectedValue(
      new ApiError("Fornecedor inválido.", 400),
    );
    const usuario = userEvent.setup();
    renderPagina();

    await waitFor(() => expect(screen.getAllByLabelText("Produto")).toHaveLength(1));
    await usuario.type(screen.getByLabelText("Data prevista"), "2026-06-01");
    await usuario.click(screen.getByRole("button", { name: "Criar pedido" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Fornecedor inválido.");
    expect(screen.queryByText("Detalhe do pedido criado")).not.toBeInTheDocument();
  });
});
