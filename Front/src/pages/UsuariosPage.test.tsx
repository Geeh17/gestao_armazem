import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UsuariosPage } from "./UsuariosPage";
import * as usuariosApi from "@/api/usuarios";
import * as perfisApi from "@/api/perfis";
import { ApiError } from "@/api/client";

const perfis = [
  { id: "perfil-1", nome: "Administrador" },
  { id: "perfil-2", nome: "Gestor de Estoque" },
];

const usuarios = [
  { id: "usuario-1", nome: "Ana", email: "ana@teste.com", perfilId: "perfil-1", perfilNome: "Administrador" },
];

describe("UsuariosPage", () => {
  it("mostra aviso para cadastrar um perfil primeiro quando não há nenhum", async () => {
    vi.spyOn(usuariosApi, "listarUsuarios").mockResolvedValue([]);
    vi.spyOn(perfisApi, "listarPerfis").mockResolvedValue([]);
    render(<UsuariosPage />);

    expect(await screen.findByText("Nenhum perfil cadastrado ainda.")).toBeInTheDocument();
  });

  it("lista os usuários com o nome do perfil", async () => {
    vi.spyOn(usuariosApi, "listarUsuarios").mockResolvedValue(usuarios);
    vi.spyOn(perfisApi, "listarPerfis").mockResolvedValue(perfis);
    render(<UsuariosPage />);

    expect(await screen.findByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("ana@teste.com")).toBeInTheDocument();
    const tabela = screen.getByRole("table");
    expect(within(tabela).getByText("Administrador")).toBeInTheDocument();
  });

  it("cadastra um novo usuário com o primeiro perfil pré-selecionado", async () => {
    vi.spyOn(usuariosApi, "listarUsuarios").mockResolvedValue([]);
    vi.spyOn(perfisApi, "listarPerfis").mockResolvedValue(perfis);
    vi.spyOn(usuariosApi, "criarUsuario").mockResolvedValue({} as (typeof usuarios)[0]);
    const usuario = userEvent.setup();
    render(<UsuariosPage />);

    await waitFor(() => expect(screen.getByLabelText("Perfil")).toHaveValue("perfil-1"));

    await usuario.type(screen.getByLabelText("Nome"), "Bruno");
    await usuario.type(screen.getByLabelText("Email"), "bruno@teste.com");
    await usuario.type(screen.getByLabelText("Senha provisória"), "senha12345");
    await usuario.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() =>
      expect(usuariosApi.criarUsuario).toHaveBeenCalledWith({
        nome: "Bruno",
        email: "bruno@teste.com",
        senha: "senha12345",
        perfilId: "perfil-1",
      }),
    );
  });

  it("mostra o erro da API quando o email já está em uso", async () => {
    vi.spyOn(usuariosApi, "listarUsuarios").mockResolvedValue([]);
    vi.spyOn(perfisApi, "listarPerfis").mockResolvedValue(perfis);
    vi.spyOn(usuariosApi, "criarUsuario").mockRejectedValue(
      new ApiError("Já existe um usuário cadastrado com este email.", 409),
    );
    const usuario = userEvent.setup();
    render(<UsuariosPage />);

    await waitFor(() => expect(screen.getByLabelText("Perfil")).toHaveValue("perfil-1"));
    await usuario.type(screen.getByLabelText("Nome"), "Bruno");
    await usuario.type(screen.getByLabelText("Email"), "ana@teste.com");
    await usuario.type(screen.getByLabelText("Senha provisória"), "senha12345");
    await usuario.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Já existe um usuário cadastrado com este email.",
    );
  });
});
