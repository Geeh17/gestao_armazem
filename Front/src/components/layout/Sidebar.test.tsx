import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { AuthProvider } from "@/context/AuthContext";
import { setToken } from "@/api/client";
import { montarTokenFake } from "@/test/token";

function renderSidebar() {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("Sidebar", () => {
  it("esconde 'Usuários' e 'Perfis' para quem não é Administrador", () => {
    setToken(montarTokenFake({ sub: "usuario-1", role: "Operador de Armazem" }));

    renderSidebar();

    expect(screen.queryByText("Usuários")).not.toBeInTheDocument();
    expect(screen.queryByText("Perfis")).not.toBeInTheDocument();
    // Itens comuns continuam visíveis normalmente.
    expect(screen.getByText("Produtos")).toBeInTheDocument();
  });

  it("esconde 'Usuários' e 'Perfis' para visitante sem sessão", () => {
    renderSidebar();

    expect(screen.queryByText("Usuários")).not.toBeInTheDocument();
    expect(screen.queryByText("Perfis")).not.toBeInTheDocument();
  });

  it("mostra 'Usuários' e 'Perfis' para Administrador", () => {
    setToken(montarTokenFake({ sub: "usuario-1", role: "Administrador" }));

    renderSidebar();

    expect(screen.getByText("Usuários")).toBeInTheDocument();
    expect(screen.getByText("Perfis")).toBeInTheDocument();
  });
});
