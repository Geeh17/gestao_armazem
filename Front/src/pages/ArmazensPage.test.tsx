import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArmazensPage } from "./ArmazensPage";
import * as armazensApi from "@/api/armazens";
import { ApiError } from "@/api/client";
import { renderComProviders } from "@/test/providers";

const armazens = [{ id: "armazem-1", nome: "Armazém Central", endereco: "Rua A, 100" }];

async function confirmarNoDialogo(usuario: ReturnType<typeof userEvent.setup>) {
  const dialogo = await screen.findByRole("dialog");
  await usuario.click(within(dialogo).getByRole("button", { name: "Excluir" }));
}

describe("ArmazensPage", () => {
  it("lista os armazéns carregados", async () => {
    vi.spyOn(armazensApi, "listarArmazens").mockResolvedValue(armazens);
    renderComProviders(<ArmazensPage />);

    expect(await screen.findByText("Armazém Central")).toBeInTheDocument();
    expect(screen.getByText("Rua A, 100")).toBeInTheDocument();
  });

  it("cadastra um novo armazém", async () => {
    vi.spyOn(armazensApi, "listarArmazens").mockResolvedValue([]);
    vi.spyOn(armazensApi, "criarArmazem").mockResolvedValue({} as (typeof armazens)[0]);
    const usuario = userEvent.setup();
    renderComProviders(<ArmazensPage />);

    await waitFor(() => expect(screen.getByText("Nenhum armazém cadastrado ainda.")).toBeInTheDocument());
    await usuario.type(screen.getByLabelText("Nome"), "Armazém Novo");
    await usuario.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() =>
      expect(armazensApi.criarArmazem).toHaveBeenCalledWith({ nome: "Armazém Novo", endereco: null }),
    );
    expect(await screen.findByText("Armazém cadastrado.")).toBeInTheDocument();
  });

  it("edita um armazém existente via atualizarArmazem", async () => {
    vi.spyOn(armazensApi, "listarArmazens").mockResolvedValue(armazens);
    vi.spyOn(armazensApi, "atualizarArmazem").mockResolvedValue({} as (typeof armazens)[0]);
    const usuario = userEvent.setup();
    renderComProviders(<ArmazensPage />);

    await usuario.click(await screen.findByRole("button", { name: "Editar" }));
    expect(screen.getByLabelText("Nome")).toHaveValue("Armazém Central");

    await usuario.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() =>
      expect(armazensApi.atualizarArmazem).toHaveBeenCalledWith("armazem-1", {
        nome: "Armazém Central",
        endereco: "Rua A, 100",
      }),
    );
  });

  it("pede confirmação num diálogo in-app antes de excluir (não window.confirm)", async () => {
    vi.spyOn(armazensApi, "listarArmazens").mockResolvedValue(armazens);
    const excluirSpy = vi.spyOn(armazensApi, "excluirArmazem").mockResolvedValue(undefined);
    const usuario = userEvent.setup();
    renderComProviders(<ArmazensPage />);

    await usuario.click(await screen.findByRole("button", { name: "Excluir" }));

    const dialogo = await screen.findByRole("dialog");
    expect(within(dialogo).getByText('Excluir o armazém "Armazém Central"?')).toBeInTheDocument();
    expect(excluirSpy).not.toHaveBeenCalled();

    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(excluirSpy).not.toHaveBeenCalled();
  });

  it("mostra erro ao excluir um armazém que já tem localizações associadas", async () => {
    vi.spyOn(armazensApi, "listarArmazens").mockResolvedValue(armazens);
    vi.spyOn(armazensApi, "excluirArmazem").mockRejectedValue(
      new ApiError("Este armazém não pode ser excluído porque já tem localizações cadastradas.", 409),
    );
    const usuario = userEvent.setup();
    renderComProviders(<ArmazensPage />);

    await usuario.click(await screen.findByRole("button", { name: "Excluir" }));
    await confirmarNoDialogo(usuario);

    expect(
      await screen.findByText(
        "Este armazém não pode ser excluído porque já tem localizações cadastradas.",
      ),
    ).toBeInTheDocument();
  });
});
