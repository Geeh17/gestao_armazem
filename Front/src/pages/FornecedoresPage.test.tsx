import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderComProviders } from "@/test/providers";
import { FornecedoresPage } from "./FornecedoresPage";
import * as fornecedoresApi from "@/api/fornecedores";

const fornecedores = [{ id: "fornecedor-1", nome: "Fornecedor A", cnpj: "11.111.111/0001-11", contato: "contato@a.com" }];

describe("FornecedoresPage", () => {
  it("lista os fornecedores carregados", async () => {
    vi.spyOn(fornecedoresApi, "listarFornecedores").mockResolvedValue(fornecedores);
    renderComProviders(<FornecedoresPage />);

    expect(await screen.findByText("Fornecedor A")).toBeInTheDocument();
    expect(screen.getByText("11.111.111/0001-11")).toBeInTheDocument();
  });

  it("cadastra um novo fornecedor", async () => {
    vi.spyOn(fornecedoresApi, "listarFornecedores").mockResolvedValue([]);
    vi.spyOn(fornecedoresApi, "criarFornecedor").mockResolvedValue({} as (typeof fornecedores)[0]);
    const usuario = userEvent.setup();
    renderComProviders(<FornecedoresPage />);

    await waitFor(() => expect(screen.getByText("Nenhum fornecedor cadastrado ainda.")).toBeInTheDocument());
    await usuario.type(screen.getByLabelText("Nome"), "Fornecedor Novo");
    await usuario.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() =>
      expect(fornecedoresApi.criarFornecedor).toHaveBeenCalledWith({
        nome: "Fornecedor Novo",
        cnpj: null,
        contato: null,
      }),
    );
  });

  it("edita um fornecedor existente e depois cancela a edição", async () => {
    vi.spyOn(fornecedoresApi, "listarFornecedores").mockResolvedValue(fornecedores);
    const usuario = userEvent.setup();
    renderComProviders(<FornecedoresPage />);

    await usuario.click(await screen.findByRole("button", { name: "Editar" }));
    expect(screen.getByRole("heading", { name: "Editar fornecedor" })).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.getByRole("heading", { name: "Novo fornecedor" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("");
  });

  it("exclui após confirmação e não exclui se o usuário recusar", async () => {
    vi.spyOn(fornecedoresApi, "listarFornecedores").mockResolvedValue(fornecedores);
    const excluirSpy = vi.spyOn(fornecedoresApi, "excluirFornecedor").mockResolvedValue(undefined);
    const usuario = userEvent.setup();
    renderComProviders(<FornecedoresPage />);

    await usuario.click(await screen.findByRole("button", { name: "Excluir" }));
    let dialogo = await screen.findByRole("dialog");
    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    expect(excluirSpy).not.toHaveBeenCalled();

    await usuario.click(screen.getByRole("button", { name: "Excluir" }));
    dialogo = await screen.findByRole("dialog");
    await usuario.click(within(dialogo).getByRole("button", { name: "Excluir" }));
    await waitFor(() => expect(excluirSpy).toHaveBeenCalledWith("fornecedor-1"));
  });
});
