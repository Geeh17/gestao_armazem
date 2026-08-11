import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ProdutosListPage } from "./ProdutosListPage";
import * as produtosApi from "@/api/produtos";
import { ApiError } from "@/api/client";
import type { Produto } from "@/types/produto";

const produtos: Produto[] = [
  { id: "produto-1", sku: "SKU-1", nome: "Produto 1", descricao: null, categoriaId: "cat-1", unidadeMedida: "UN", codigoBarras: null, estoqueMinimo: 5 },
];

function renderPagina() {
  return render(
    <MemoryRouter>
      <ProdutosListPage />
    </MemoryRouter>,
  );
}

describe("ProdutosListPage", () => {
  it("mostra o estado vazio quando não há produtos", async () => {
    vi.spyOn(produtosApi, "listarProdutos").mockResolvedValue([]);
    renderPagina();

    expect(await screen.findByText("Nenhum produto cadastrado ainda.")).toBeInTheDocument();
  });

  it("lista os produtos com SKU, nome, unidade e estoque mínimo", async () => {
    vi.spyOn(produtosApi, "listarProdutos").mockResolvedValue(produtos);
    renderPagina();

    expect(await screen.findByText("SKU-1")).toBeInTheDocument();
    expect(screen.getByText("Produto 1")).toBeInTheDocument();
  });

  it("exclui o produto após confirmação, e não exclui se o usuário recusar", async () => {
    vi.spyOn(produtosApi, "listarProdutos").mockResolvedValue(produtos);
    const excluirSpy = vi.spyOn(produtosApi, "excluirProduto").mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const usuario = userEvent.setup();
    renderPagina();

    await usuario.click(await screen.findByRole("button", { name: "Excluir" }));
    expect(excluirSpy).not.toHaveBeenCalled();

    confirmSpy.mockReturnValue(true);
    await usuario.click(screen.getByRole("button", { name: "Excluir" }));
    await waitFor(() => expect(excluirSpy).toHaveBeenCalledWith("produto-1"));
  });

  it("mostra o erro da API quando a exclusão falha (produto com estoque/movimentações)", async () => {
    vi.spyOn(produtosApi, "listarProdutos").mockResolvedValue(produtos);
    vi.spyOn(produtosApi, "excluirProduto").mockRejectedValue(
      new ApiError("Este produto não pode ser excluído porque já tem estoque associado.", 409),
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const usuario = userEvent.setup();
    renderPagina();

    await usuario.click(await screen.findByRole("button", { name: "Excluir" }));

    expect(
      await screen.findByText("Este produto não pode ser excluído porque já tem estoque associado."),
    ).toBeInTheDocument();
  });

  it("tem um link 'Editar' apontando para a rota de edição do produto", async () => {
    vi.spyOn(produtosApi, "listarProdutos").mockResolvedValue(produtos);
    renderPagina();

    const linkEditar = await screen.findByRole("link", { name: "Editar" });
    expect(linkEditar).toHaveAttribute("href", "/produtos/produto-1/editar");
  });
});
