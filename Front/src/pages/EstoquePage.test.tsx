import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EstoquePage } from "./EstoquePage";
import * as produtosApi from "@/api/produtos";
import * as localizacoesApi from "@/api/localizacoes";
import * as armazensApi from "@/api/armazens";
import * as estoqueApi from "@/api/estoque";
import { ApiError } from "@/api/client";
import type { Produto } from "@/types/produto";

const produtos: Produto[] = [
  { id: "produto-1", sku: "SKU-1", nome: "Produto 1", descricao: null, categoriaId: "cat-1", unidadeMedida: "UN", codigoBarras: null, estoqueMinimo: 0 },
  { id: "produto-2", sku: "SKU-2", nome: "Produto 2", descricao: null, categoriaId: "cat-1", unidadeMedida: "UN", codigoBarras: null, estoqueMinimo: 0 },
];

const localizacoes = [
  { id: "loc-1", armazemId: "armazem-1", corredor: "A1", prateleira: "P1", nivel: "N1", codigo: "A1-P1-N1" },
];

const armazens = [{ id: "armazem-1", nome: "Armazém Central", endereco: null }];

function mockarCarregamentoInicial() {
  vi.spyOn(produtosApi, "listarProdutos").mockResolvedValue(produtos);
  vi.spyOn(localizacoesApi, "listarLocalizacoes").mockResolvedValue(localizacoes);
  vi.spyOn(armazensApi, "listarArmazens").mockResolvedValue(armazens);
}

describe("EstoquePage", () => {
  it("consulta o saldo do primeiro produto automaticamente ao carregar", async () => {
    mockarCarregamentoInicial();
    vi.spyOn(estoqueApi, "consultarEstoquePorProduto").mockResolvedValue([
      { produtoId: "produto-1", localizacaoId: "loc-1", quantidade: 42 },
    ]);
    render(<EstoquePage />);

    await waitFor(() =>
      expect(estoqueApi.consultarEstoquePorProduto).toHaveBeenCalledWith("produto-1"),
    );
    expect(await screen.findByText("42")).toBeInTheDocument();
    expect(screen.getByText("Armazém Central - A1-P1-N1")).toBeInTheDocument();
  });

  it("trocar o produto no select refaz a consulta automaticamente", async () => {
    mockarCarregamentoInicial();
    vi.spyOn(estoqueApi, "consultarEstoquePorProduto").mockResolvedValue([
      { produtoId: "produto-1", localizacaoId: "loc-1", quantidade: 10 },
    ]);
    const usuario = userEvent.setup();
    render(<EstoquePage />);

    await waitFor(() =>
      expect(estoqueApi.consultarEstoquePorProduto).toHaveBeenCalledWith("produto-1"),
    );

    await usuario.selectOptions(screen.getByLabelText("Produto"), "Produto 2 (SKU-2)");

    await waitFor(() =>
      expect(estoqueApi.consultarEstoquePorProduto).toHaveBeenCalledWith("produto-2"),
    );
  });

  it("mostra o estado vazio quando o produto não tem saldo em nenhuma localização", async () => {
    mockarCarregamentoInicial();
    vi.spyOn(estoqueApi, "consultarEstoquePorProduto").mockResolvedValue([]);
    render(<EstoquePage />);

    expect(await screen.findByText("Sem saldo para este produto.")).toBeInTheDocument();
  });

  it("mostra o erro da API quando a consulta de saldo falha", async () => {
    mockarCarregamentoInicial();
    vi.spyOn(estoqueApi, "consultarEstoquePorProduto").mockRejectedValue(
      new ApiError("Produto inválido.", 400),
    );
    render(<EstoquePage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Produto inválido.");
  });
});
