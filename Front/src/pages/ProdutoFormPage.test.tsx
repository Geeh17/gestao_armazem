import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProdutoFormPage } from "./ProdutoFormPage";
import * as produtosApi from "@/api/produtos";
import * as categoriasApi from "@/api/categorias";
import { ApiError } from "@/api/client";
import type { Produto } from "@/types/produto";

const categorias = [
  { id: "cat-1", nome: "Eletrônicos" },
  { id: "cat-2", nome: "Embalagens" },
];

function renderComRota(caminhoInicial: string) {
  return render(
    <MemoryRouter initialEntries={[caminhoInicial]}>
      <Routes>
        <Route path="/produtos" element={<div>Lista de produtos</div>} />
        <Route path="/produtos/novo" element={<ProdutoFormPage />} />
        <Route path="/produtos/:id/editar" element={<ProdutoFormPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProdutoFormPage", () => {
  it("modo criar: SKU fica editável e submete via criarProduto", async () => {
    vi.spyOn(categoriasApi, "listarCategorias").mockResolvedValue(categorias);
    vi.spyOn(produtosApi, "criarProduto").mockResolvedValue({} as Produto);
    vi.spyOn(produtosApi, "atualizarProduto");
    const usuario = userEvent.setup();

    renderComRota("/produtos/novo");

    await waitFor(() => expect(screen.getByLabelText("SKU")).not.toBeDisabled());

    await usuario.type(screen.getByLabelText("SKU"), "SKU-NOVO");
    await usuario.type(screen.getByLabelText("Nome"), "Produto Novo");
    await usuario.clear(screen.getByLabelText("Unidade de medida"));
    await usuario.type(screen.getByLabelText("Unidade de medida"), "UN");
    await usuario.click(screen.getByRole("button", { name: "Salvar produto" }));

    await waitFor(() => expect(screen.getByText("Lista de produtos")).toBeInTheDocument());

    expect(produtosApi.criarProduto).toHaveBeenCalledWith(
      expect.objectContaining({ sku: "SKU-NOVO", nome: "Produto Novo" }),
    );
    expect(produtosApi.atualizarProduto).not.toHaveBeenCalled();
  });

  it("modo editar: carrega o produto, trava o SKU e submete via atualizarProduto (sem sku)", async () => {
    vi.spyOn(categoriasApi, "listarCategorias").mockResolvedValue(categorias);
    vi.spyOn(produtosApi, "obterProduto").mockResolvedValue({
      id: "produto-1",
      sku: "SKU-EXISTENTE",
      nome: "Produto Existente",
      descricao: null,
      categoriaId: "cat-1",
      unidadeMedida: "UN",
      codigoBarras: null,
      estoqueMinimo: 5,
    });
    vi.spyOn(produtosApi, "atualizarProduto").mockResolvedValue({} as Produto);
    vi.spyOn(produtosApi, "criarProduto");
    const usuario = userEvent.setup();

    renderComRota("/produtos/produto-1/editar");

    const campoSku = await screen.findByLabelText("SKU");
    expect(campoSku).toHaveValue("SKU-EXISTENTE");
    expect(campoSku).toBeDisabled();

    const campoNome = screen.getByLabelText("Nome");
    await usuario.clear(campoNome);
    await usuario.type(campoNome, "Produto Renomeado");
    await usuario.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(screen.getByText("Lista de produtos")).toBeInTheDocument());

    expect(produtosApi.atualizarProduto).toHaveBeenCalledWith(
      "produto-1",
      expect.objectContaining({ nome: "Produto Renomeado" }),
    );
    // O DTO de atualização não tem o campo sku — RN03, SKU não é editável.
    const [, dtoEnviado] = vi.mocked(produtosApi.atualizarProduto).mock.calls[0];
    expect(dtoEnviado).not.toHaveProperty("sku");
    expect(produtosApi.criarProduto).not.toHaveBeenCalled();
  });

  it("mostra erro da API sem navegar quando o salvamento falha", async () => {
    vi.spyOn(categoriasApi, "listarCategorias").mockResolvedValue(categorias);
    vi.spyOn(produtosApi, "criarProduto").mockRejectedValue(
      new ApiError("Já existe um produto com esse SKU.", 409),
    );
    const usuario = userEvent.setup();

    renderComRota("/produtos/novo");

    await waitFor(() => expect(screen.getByLabelText("SKU")).not.toBeDisabled());
    await usuario.type(screen.getByLabelText("SKU"), "SKU-DUPLICADO");
    await usuario.type(screen.getByLabelText("Nome"), "Produto X");
    await usuario.click(screen.getByRole("button", { name: "Salvar produto" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Já existe um produto com esse SKU.");
    expect(screen.queryByText("Lista de produtos")).not.toBeInTheDocument();
  });
});
