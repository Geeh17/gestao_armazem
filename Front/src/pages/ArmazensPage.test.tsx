import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArmazensPage } from "./ArmazensPage";
import * as armazensApi from "@/api/armazens";
import { ApiError } from "@/api/client";

const armazens = [{ id: "armazem-1", nome: "Armazém Central", endereco: "Rua A, 100" }];

describe("ArmazensPage", () => {
  it("lista os armazéns carregados", async () => {
    vi.spyOn(armazensApi, "listarArmazens").mockResolvedValue(armazens);
    render(<ArmazensPage />);

    expect(await screen.findByText("Armazém Central")).toBeInTheDocument();
    expect(screen.getByText("Rua A, 100")).toBeInTheDocument();
  });

  it("cadastra um novo armazém", async () => {
    vi.spyOn(armazensApi, "listarArmazens").mockResolvedValue([]);
    vi.spyOn(armazensApi, "criarArmazem").mockResolvedValue({} as (typeof armazens)[0]);
    const usuario = userEvent.setup();
    render(<ArmazensPage />);

    await waitFor(() => expect(screen.getByText("Nenhum armazém cadastrado ainda.")).toBeInTheDocument());
    await usuario.type(screen.getByLabelText("Nome"), "Armazém Novo");
    await usuario.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() =>
      expect(armazensApi.criarArmazem).toHaveBeenCalledWith({ nome: "Armazém Novo", endereco: null }),
    );
  });

  it("edita um armazém existente via atualizarArmazem", async () => {
    vi.spyOn(armazensApi, "listarArmazens").mockResolvedValue(armazens);
    vi.spyOn(armazensApi, "atualizarArmazem").mockResolvedValue({} as (typeof armazens)[0]);
    const usuario = userEvent.setup();
    render(<ArmazensPage />);

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

  it("mostra erro ao excluir um armazém que já tem localizações associadas", async () => {
    vi.spyOn(armazensApi, "listarArmazens").mockResolvedValue(armazens);
    vi.spyOn(armazensApi, "excluirArmazem").mockRejectedValue(
      new ApiError("Este armazém não pode ser excluído porque já tem localizações cadastradas.", 409),
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const usuario = userEvent.setup();
    render(<ArmazensPage />);

    await usuario.click(await screen.findByRole("button", { name: "Excluir" }));

    expect(
      await screen.findByText(
        "Este armazém não pode ser excluído porque já tem localizações cadastradas.",
      ),
    ).toBeInTheDocument();
  });
});
