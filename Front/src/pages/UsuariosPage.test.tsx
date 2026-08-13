import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderComProviders } from "@/test/providers";
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
    renderComProviders(<UsuariosPage />);

    expect(await screen.findByText("Nenhum perfil cadastrado ainda.")).toBeInTheDocument();
  });

  it("lista os usuários com o nome do perfil", async () => {
    vi.spyOn(usuariosApi, "listarUsuarios").mockResolvedValue(usuarios);
    vi.spyOn(perfisApi, "listarPerfis").mockResolvedValue(perfis);
    renderComProviders(<UsuariosPage />);

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
    renderComProviders(<UsuariosPage />);

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
    renderComProviders(<UsuariosPage />);

    await waitFor(() => expect(screen.getByLabelText("Perfil")).toHaveValue("perfil-1"));
    await usuario.type(screen.getByLabelText("Nome"), "Bruno");
    await usuario.type(screen.getByLabelText("Email"), "ana@teste.com");
    await usuario.type(screen.getByLabelText("Senha provisória"), "senha12345");
    await usuario.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Já existe um usuário cadastrado com este email.",
    );
  });

  it("edita um usuário existente sem exigir senha, e sem mostrar o campo de senha", async () => {
    vi.spyOn(usuariosApi, "listarUsuarios").mockResolvedValue(usuarios);
    vi.spyOn(perfisApi, "listarPerfis").mockResolvedValue(perfis);
    vi.spyOn(usuariosApi, "atualizarUsuario").mockResolvedValue({} as (typeof usuarios)[0]);
    const usuario = userEvent.setup();
    renderComProviders(<UsuariosPage />);

    await usuario.click(await screen.findByRole("button", { name: "Editar" }));

    expect(screen.getByLabelText("Nome")).toHaveValue("Ana");
    expect(screen.queryByLabelText("Senha provisória")).not.toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() =>
      expect(usuariosApi.atualizarUsuario).toHaveBeenCalledWith("usuario-1", {
        nome: "Ana",
        email: "ana@teste.com",
        perfilId: "perfil-1",
      }),
    );
    expect(await screen.findByText("Usuário atualizado.")).toBeInTheDocument();
  });

  it("exclui um usuário após confirmação", async () => {
    vi.spyOn(usuariosApi, "listarUsuarios").mockResolvedValue(usuarios);
    vi.spyOn(perfisApi, "listarPerfis").mockResolvedValue(perfis);
    vi.spyOn(usuariosApi, "excluirUsuario").mockResolvedValue(undefined);
    const usuario = userEvent.setup();
    renderComProviders(<UsuariosPage />);

    await usuario.click(await screen.findByRole("button", { name: "Excluir" }));
    const dialogo = await screen.findByRole("dialog");
    await usuario.click(within(dialogo).getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(usuariosApi.excluirUsuario).toHaveBeenCalledWith("usuario-1"));
  });

  it("mostra o erro da API ao excluir um usuário que já registrou movimentações", async () => {
    vi.spyOn(usuariosApi, "listarUsuarios").mockResolvedValue(usuarios);
    vi.spyOn(perfisApi, "listarPerfis").mockResolvedValue(perfis);
    vi.spyOn(usuariosApi, "excluirUsuario").mockRejectedValue(
      new ApiError("Este usuário não pode ser excluído porque já registrou movimentações de estoque.", 409),
    );
    const usuario = userEvent.setup();
    renderComProviders(<UsuariosPage />);

    await usuario.click(await screen.findByRole("button", { name: "Excluir" }));
    const dialogo = await screen.findByRole("dialog");
    await usuario.click(within(dialogo).getByRole("button", { name: "Excluir" }));

    expect(
      await screen.findByText(
        "Este usuário não pode ser excluído porque já registrou movimentações de estoque.",
      ),
    ).toBeInTheDocument();
  });

  it("redefine a senha de um usuário via diálogo, sem chamar a API se cancelado", async () => {
    vi.spyOn(usuariosApi, "listarUsuarios").mockResolvedValue(usuarios);
    vi.spyOn(perfisApi, "listarPerfis").mockResolvedValue(perfis);
    const resetarSpy = vi.spyOn(usuariosApi, "resetarSenhaUsuario").mockResolvedValue(undefined);
    const usuario = userEvent.setup();
    renderComProviders(<UsuariosPage />);

    await usuario.click(await screen.findByRole("button", { name: "Redefinir senha" }));
    let dialogo = await screen.findByRole("dialog");
    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    expect(resetarSpy).not.toHaveBeenCalled();

    await usuario.click(screen.getByRole("button", { name: "Redefinir senha" }));
    dialogo = await screen.findByRole("dialog");
    await usuario.type(within(dialogo).getByLabelText("Nova senha"), "nova-senha-123");
    await usuario.click(within(dialogo).getByRole("button", { name: "Redefinir" }));

    await waitFor(() =>
      expect(resetarSpy).toHaveBeenCalledWith("usuario-1", "nova-senha-123"),
    );
    expect(await screen.findByText(/Senha de Ana redefinida/)).toBeInTheDocument();
  });
});
