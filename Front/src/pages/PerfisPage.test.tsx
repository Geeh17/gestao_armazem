import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PerfisPage } from "./PerfisPage";
import * as perfisApi from "@/api/perfis";
import { ApiError } from "@/api/client";

describe("PerfisPage", () => {
  it("lista os perfis carregados", async () => {
    vi.spyOn(perfisApi, "listarPerfis").mockResolvedValue([
      { id: "perfil-1", nome: "Administrador" },
      { id: "perfil-2", nome: "Gestor de Estoque" },
    ]);
    render(<PerfisPage />);

    expect(await screen.findByText("Administrador")).toBeInTheDocument();
    expect(screen.getByText("Gestor de Estoque")).toBeInTheDocument();
  });

  it("mostra o estado vazio quando não há perfis", async () => {
    vi.spyOn(perfisApi, "listarPerfis").mockResolvedValue([]);
    render(<PerfisPage />);

    expect(await screen.findByText("Nenhum perfil cadastrado ainda.")).toBeInTheDocument();
  });

  it("cadastra um novo perfil e limpa o campo", async () => {
    vi.spyOn(perfisApi, "listarPerfis").mockResolvedValue([]);
    vi.spyOn(perfisApi, "criarPerfil").mockResolvedValue({ id: "perfil-novo", nome: "Financeiro" });
    const usuario = userEvent.setup();
    render(<PerfisPage />);

    await waitFor(() => expect(screen.getByText("Nenhum perfil cadastrado ainda.")).toBeInTheDocument());
    await usuario.type(screen.getByLabelText("Nome"), "Financeiro");
    await usuario.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => expect(perfisApi.criarPerfil).toHaveBeenCalledWith({ nome: "Financeiro" }));
    expect(screen.getByLabelText("Nome")).toHaveValue("");
  });

  it("mostra o erro da API ao falhar o cadastro", async () => {
    vi.spyOn(perfisApi, "listarPerfis").mockResolvedValue([]);
    vi.spyOn(perfisApi, "criarPerfil").mockRejectedValue(new ApiError("Nome do perfil é obrigatório.", 400));
    const usuario = userEvent.setup();
    render(<PerfisPage />);

    await waitFor(() => expect(screen.getByText("Nenhum perfil cadastrado ainda.")).toBeInTheDocument());
    await usuario.type(screen.getByLabelText("Nome"), "X");
    await usuario.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Nome do perfil é obrigatório.");
  });
});
