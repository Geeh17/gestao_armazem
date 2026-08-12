import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { AuthProvider } from "@/context/AuthContext";
import { ApiError } from "@/api/client";
import * as authApi from "@/api/auth";
import { montarTokenFake } from "@/test/token";

function renderLoginPage() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Visão geral</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("LoginPage", () => {
  it("faz login com sucesso e navega para a tela inicial", async () => {
    const token = montarTokenFake({ sub: "usuario-1", role: "Administrador" });
    vi.spyOn(authApi, "login").mockResolvedValue({ token, expiraEm: "2026-01-01T00:00:00Z", refreshToken: "refresh-fake" });
    const usuario = userEvent.setup();

    renderLoginPage();

    await usuario.type(screen.getByLabelText("Email"), "admin@gestaoarmazem.local");
    await usuario.type(screen.getByLabelText("Senha"), "Admin@123");
    await usuario.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(screen.getByText("Visão geral")).toBeInTheDocument());
    expect(authApi.login).toHaveBeenCalledWith({
      email: "admin@gestaoarmazem.local",
      senha: "Admin@123",
    });
  });

  it("mostra a mensagem de erro da API e permanece na tela de login", async () => {
    vi.spyOn(authApi, "login").mockRejectedValue(new ApiError("Email ou senha inválidos.", 401));
    const usuario = userEvent.setup();

    renderLoginPage();

    await usuario.type(screen.getByLabelText("Email"), "usuario@teste.com");
    await usuario.type(screen.getByLabelText("Senha"), "senha-errada");
    await usuario.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Email ou senha inválidos.");
    expect(screen.queryByText("Visão geral")).not.toBeInTheDocument();
  });

  it("exige email e senha antes de permitir o envio (validação HTML nativa)", () => {
    renderLoginPage();

    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Senha")).toBeRequired();
  });
});
