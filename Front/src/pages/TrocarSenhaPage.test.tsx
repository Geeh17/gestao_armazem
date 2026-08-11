import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrocarSenhaPage } from "./TrocarSenhaPage";
import { ApiError } from "@/api/client";
import * as authApi from "@/api/auth";

describe("TrocarSenhaPage", () => {
  it("bloqueia o envio quando a confirmação não bate com a nova senha", async () => {
    const alterarSenhaSpy = vi.spyOn(authApi, "alterarSenha");
    const usuario = userEvent.setup();

    render(<TrocarSenhaPage />);

    await usuario.type(screen.getByLabelText("Senha atual"), "senha-atual-123");
    await usuario.type(screen.getByLabelText("Nova senha"), "senha-nova-123");
    await usuario.type(screen.getByLabelText("Confirmar nova senha"), "senha-diferente-123");
    await usuario.click(screen.getByRole("button", { name: "Salvar nova senha" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A confirmação não bate com a nova senha.",
    );
    expect(alterarSenhaSpy).not.toHaveBeenCalled();
  });

  it("envia a troca de senha quando a confirmação bate, e limpa o formulário", async () => {
    vi.spyOn(authApi, "alterarSenha").mockResolvedValue(undefined);
    const usuario = userEvent.setup();

    render(<TrocarSenhaPage />);

    await usuario.type(screen.getByLabelText("Senha atual"), "senha-atual-123");
    await usuario.type(screen.getByLabelText("Nova senha"), "senha-nova-123");
    await usuario.type(screen.getByLabelText("Confirmar nova senha"), "senha-nova-123");
    await usuario.click(screen.getByRole("button", { name: "Salvar nova senha" }));

    expect(await screen.findByText("Senha alterada com sucesso.")).toBeInTheDocument();
    expect(authApi.alterarSenha).toHaveBeenCalledWith({
      senhaAtual: "senha-atual-123",
      novaSenha: "senha-nova-123",
    });

    expect(screen.getByLabelText("Senha atual")).toHaveValue("");
    expect(screen.getByLabelText("Nova senha")).toHaveValue("");
  });

  it("mostra a mensagem de erro da API quando a senha atual está incorreta", async () => {
    vi.spyOn(authApi, "alterarSenha").mockRejectedValue(new ApiError("Senha atual incorreta.", 401));
    const usuario = userEvent.setup();

    render(<TrocarSenhaPage />);

    await usuario.type(screen.getByLabelText("Senha atual"), "senha-errada-123");
    await usuario.type(screen.getByLabelText("Nova senha"), "senha-nova-123");
    await usuario.type(screen.getByLabelText("Confirmar nova senha"), "senha-nova-123");
    await usuario.click(screen.getByRole("button", { name: "Salvar nova senha" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Senha atual incorreta.");
  });
});
