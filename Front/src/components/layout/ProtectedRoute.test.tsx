import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import { setToken } from "@/api/client";
import { montarTokenFake } from "@/test/token";

function renderComRota(caminhoInicial: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[caminhoInicial]}>
        <Routes>
          <Route path="/login" element={<div>Tela de login</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/produtos" element={<div>Tela de produtos</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("ProtectedRoute", () => {
  it("redireciona para /login quando não há usuário autenticado", () => {
    renderComRota("/produtos");

    expect(screen.getByText("Tela de login")).toBeInTheDocument();
    expect(screen.queryByText("Tela de produtos")).not.toBeInTheDocument();
  });

  it("renderiza a rota protegida quando há um token salvo", () => {
    setToken(montarTokenFake({ sub: "usuario-1", role: "Operador de Armazem" }));

    renderComRota("/produtos");

    expect(screen.getByText("Tela de produtos")).toBeInTheDocument();
  });
});
