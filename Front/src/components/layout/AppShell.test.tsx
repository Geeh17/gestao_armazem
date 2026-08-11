import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./AppShell";
import { AuthProvider } from "@/context/AuthContext";
import { setToken, getToken } from "@/api/client";
import { montarTokenFake } from "@/test/token";

function renderAppShell(caminhoInicial = "/") {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[caminhoInicial]}>
        <Routes>
          <Route path="/trocar-senha" element={<div>Tela de trocar senha</div>} />
          <Route element={<AppShell />}>
            <Route path="/" element={<div>Conteúdo da página</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("AppShell", () => {
  it("mostra o nome e o perfil do usuário logado na topbar", () => {
    setToken(montarTokenFake({ sub: "usuario-1", name: "Ana Gestora", role: "Gestor de Estoque" }));
    renderAppShell();

    expect(screen.getByText("Ana Gestora")).toBeInTheDocument();
    expect(screen.getByText("· Gestor de Estoque")).toBeInTheDocument();
  });

  it("não quebra quando o token não tem claim de nome", () => {
    setToken(montarTokenFake({ sub: "usuario-1" }));
    renderAppShell();

    // Sem nome, a topbar (banner) não deve renderizar nenhum "· Perfil" órfão.
    // Escopado ao header porque o rodapé da Sidebar também usa "·" no texto de versão.
    const topbar = screen.getByRole("banner");
    expect(within(topbar).queryByText(/·/)).not.toBeInTheDocument();
  });

  it("renderiza o conteúdo da rota filha (Outlet)", () => {
    setToken(montarTokenFake({ sub: "usuario-1", name: "Ana" }));
    renderAppShell();

    expect(screen.getByText("Conteúdo da página")).toBeInTheDocument();
  });

  it("o link 'Trocar senha' aponta para a rota certa", () => {
    setToken(montarTokenFake({ sub: "usuario-1", name: "Ana" }));
    renderAppShell();

    expect(screen.getByRole("link", { name: "Trocar senha" })).toHaveAttribute(
      "href",
      "/trocar-senha",
    );
  });

  it("clicar em 'Sair' desloga o usuário (limpa o token)", async () => {
    setToken(montarTokenFake({ sub: "usuario-1", name: "Ana Gestora" }));
    const usuario = userEvent.setup();
    renderAppShell();

    expect(screen.getByText("Ana Gestora")).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Sair" }));

    expect(getToken()).toBeNull();
    expect(screen.queryByText("Ana Gestora")).not.toBeInTheDocument();
  });
});
