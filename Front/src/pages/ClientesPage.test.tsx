import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderComProviders } from "@/test/providers";
import { ClientesPage } from "./ClientesPage";
import * as clientesApi from "@/api/clientes";
import { ApiError } from "@/api/client";

const clientes = [{ id: "cliente-1", nome: "Cliente A", documento: "111.111.111-11", contato: "a@teste.com" }];

describe("ClientesPage", () => {
  it("lista os clientes carregados", async () => {
    vi.spyOn(clientesApi, "listarClientes").mockResolvedValue(clientes);
    renderComProviders(<ClientesPage />);

    expect(await screen.findByText("Cliente A")).toBeInTheDocument();
    expect(screen.getByText("111.111.111-11")).toBeInTheDocument();
  });

  it("cadastra um novo cliente e limpa o formulário", async () => {
    vi.spyOn(clientesApi, "listarClientes").mockResolvedValue([]);
    vi.spyOn(clientesApi, "criarCliente").mockResolvedValue({} as (typeof clientes)[0]);
    const usuario = userEvent.setup();
    renderComProviders(<ClientesPage />);

    await waitFor(() => expect(screen.getByText("Nenhum cliente cadastrado ainda.")).toBeInTheDocument());

    await usuario.type(screen.getByLabelText("Nome"), "Cliente Novo");
    await usuario.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() =>
      expect(clientesApi.criarCliente).toHaveBeenCalledWith({
        nome: "Cliente Novo",
        documento: null,
        contato: null,
      }),
    );
    expect(screen.getByLabelText("Nome")).toHaveValue("");
  });

  it("clicar em 'Editar' carrega o cliente no formulário e submete via atualizarCliente", async () => {
    vi.spyOn(clientesApi, "listarClientes").mockResolvedValue(clientes);
    vi.spyOn(clientesApi, "atualizarCliente").mockResolvedValue({} as (typeof clientes)[0]);
    const usuario = userEvent.setup();
    renderComProviders(<ClientesPage />);

    await usuario.click(await screen.findByRole("button", { name: "Editar" }));

    expect(screen.getByLabelText("Nome")).toHaveValue("Cliente A");
    expect(screen.getByRole("heading", { name: "Editar cliente" })).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() =>
      expect(clientesApi.atualizarCliente).toHaveBeenCalledWith("cliente-1", {
        nome: "Cliente A",
        documento: "111.111.111-11",
        contato: "a@teste.com",
      }),
    );
  });

  it("exclui o cliente após confirmação do usuário", async () => {
    vi.spyOn(clientesApi, "listarClientes").mockResolvedValue(clientes);
    vi.spyOn(clientesApi, "excluirCliente").mockResolvedValue(undefined);
    const usuario = userEvent.setup();
    renderComProviders(<ClientesPage />);

    await usuario.click(await screen.findByRole("button", { name: "Excluir" }));
    const dialogo = await screen.findByRole("dialog");
    await usuario.click(within(dialogo).getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(clientesApi.excluirCliente).toHaveBeenCalledWith("cliente-1"));
  });

  it("mostra erro da API ao falhar a exclusão (ex.: cliente com pedidos associados)", async () => {
    vi.spyOn(clientesApi, "listarClientes").mockResolvedValue(clientes);
    vi.spyOn(clientesApi, "excluirCliente").mockRejectedValue(
      new ApiError("Este cliente não pode ser excluído porque já tem pedidos associados.", 409),
    );
    const usuario = userEvent.setup();
    renderComProviders(<ClientesPage />);

    await usuario.click(await screen.findByRole("button", { name: "Excluir" }));
    const dialogo = await screen.findByRole("dialog");
    await usuario.click(within(dialogo).getByRole("button", { name: "Excluir" }));

    expect(
      await screen.findByText("Este cliente não pode ser excluído porque já tem pedidos associados."),
    ).toBeInTheDocument();
  });
});
