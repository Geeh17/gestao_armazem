import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AdminRoute } from "./AdminRoute";
import { AuthProvider } from "@/context/AuthContext";
import { setToken } from "@/api/client";
import { montarTokenFake } from "@/test/token";

function renderComRota(caminhoInicial: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[caminhoInicial]}>
        <Routes>
          <Route path="/" element={<div>Visão geral</div>} />
          <Route element={<AdminRoute />}>
            <Route path="/usuarios" element={<div>Tela de usuários</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("AdminRoute", () => {
  it("redireciona para / quando o usuário não é Administrador", () => {
    setToken(montarTokenFake({ sub: "usuario-1", role: "Gestor de Estoque" }));

    renderComRota("/usuarios");

    expect(screen.getByText("Visão geral")).toBeInTheDocument();
    expect(screen.queryByText("Tela de usuários")).not.toBeInTheDocument();
  });

  it("redireciona para / quando não há usuário autenticado", () => {
    renderComRota("/usuarios");

    expect(screen.getByText("Visão geral")).toBeInTheDocument();
  });

  it("renderiza a rota quando o usuário é Administrador", () => {
    setToken(montarTokenFake({ sub: "usuario-1", role: "Administrador" }));

    renderComRota("/usuarios");

    expect(screen.getByText("Tela de usuários")).toBeInTheDocument();
  });
});
