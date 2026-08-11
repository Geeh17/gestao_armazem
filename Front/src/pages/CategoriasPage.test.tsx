import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoriasPage } from "./CategoriasPage";
import * as categoriasApi from "@/api/categorias";
import { ApiError } from "@/api/client";

const categorias = [{ id: "cat-1", nome: "Eletrônicos" }];

describe("CategoriasPage", () => {
  it("lista as categorias carregadas", async () => {
    vi.spyOn(categoriasApi, "listarCategorias").mockResolvedValue(categorias);
    render(<CategoriasPage />);

    expect(await screen.findByText("Eletrônicos")).toBeInTheDocument();
  });

  it("mostra o estado vazio quando não há categorias", async () => {
    vi.spyOn(categoriasApi, "listarCategorias").mockResolvedValue([]);
    render(<CategoriasPage />);

    expect(await screen.findByText("Nenhuma categoria cadastrada ainda.")).toBeInTheDocument();
  });

  it("cadastra uma nova categoria e limpa o campo", async () => {
    vi.spyOn(categoriasApi, "listarCategorias").mockResolvedValue([]);
    vi.spyOn(categoriasApi, "criarCategoria").mockResolvedValue({ id: "cat-novo", nome: "Embalagens" });
    const usuario = userEvent.setup();
    render(<CategoriasPage />);

    await waitFor(() => expect(screen.getByText("Nenhuma categoria cadastrada ainda.")).toBeInTheDocument());
    await usuario.type(screen.getByLabelText("Nome"), "Embalagens");
    await usuario.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => expect(categoriasApi.criarCategoria).toHaveBeenCalledWith({ nome: "Embalagens" }));
    expect(screen.getByLabelText("Nome")).toHaveValue("");
  });

  it("edita uma categoria existente via atualizarCategoria", async () => {
    vi.spyOn(categoriasApi, "listarCategorias").mockResolvedValue(categorias);
    vi.spyOn(categoriasApi, "atualizarCategoria").mockResolvedValue({ id: "cat-1", nome: "Eletrônicos e Informática" });
    const usuario = userEvent.setup();
    render(<CategoriasPage />);

    await usuario.click(await screen.findByRole("button", { name: "Editar" }));
    expect(screen.getByLabelText("Nome")).toHaveValue("Eletrônicos");
    expect(screen.getByRole("heading", { name: "Editar categoria" })).toBeInTheDocument();

    await usuario.clear(screen.getByLabelText("Nome"));
    await usuario.type(screen.getByLabelText("Nome"), "Eletrônicos e Informática");
    await usuario.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() =>
      expect(categoriasApi.atualizarCategoria).toHaveBeenCalledWith("cat-1", { nome: "Eletrônicos e Informática" }),
    );
  });

  it("mostra o erro da API ao excluir uma categoria com produtos associados", async () => {
    vi.spyOn(categoriasApi, "listarCategorias").mockResolvedValue(categorias);
    vi.spyOn(categoriasApi, "excluirCategoria").mockRejectedValue(
      new ApiError("Esta categoria não pode ser excluída porque já tem produtos associados.", 409),
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const usuario = userEvent.setup();
    render(<CategoriasPage />);

    await usuario.click(await screen.findByRole("button", { name: "Excluir" }));

    expect(
      await screen.findByText("Esta categoria não pode ser excluída porque já tem produtos associados."),
    ).toBeInTheDocument();
  });

  it("não exclui se o usuário recusar a confirmação", async () => {
    vi.spyOn(categoriasApi, "listarCategorias").mockResolvedValue(categorias);
    const excluirSpy = vi.spyOn(categoriasApi, "excluirCategoria");
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const usuario = userEvent.setup();
    render(<CategoriasPage />);

    await usuario.click(await screen.findByRole("button", { name: "Excluir" }));

    expect(excluirSpy).not.toHaveBeenCalled();
  });
});
