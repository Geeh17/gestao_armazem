import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("mostra o número da página atual", () => {
    render(
      <Pagination pagina={3} temProximaPagina={true} onPaginaAnterior={() => {}} onProximaPagina={() => {}} />,
    );
    expect(screen.getByText("Página 3")).toBeInTheDocument();
  });

  it("desabilita 'Anterior' na página 1", () => {
    render(
      <Pagination pagina={1} temProximaPagina={true} onPaginaAnterior={() => {}} onProximaPagina={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
  });

  it("habilita 'Anterior' a partir da página 2", () => {
    render(
      <Pagination pagina={2} temProximaPagina={false} onPaginaAnterior={() => {}} onProximaPagina={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "Anterior" })).not.toBeDisabled();
  });

  it("desabilita 'Próxima' quando temProximaPagina é false", () => {
    render(
      <Pagination pagina={1} temProximaPagina={false} onPaginaAnterior={() => {}} onProximaPagina={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();
  });

  it("chama onProximaPagina e onPaginaAnterior ao clicar", async () => {
    const onProxima = vi.fn();
    const onAnterior = vi.fn();
    const usuario = userEvent.setup();

    render(
      <Pagination pagina={2} temProximaPagina={true} onPaginaAnterior={onAnterior} onProximaPagina={onProxima} />,
    );

    await usuario.click(screen.getByRole("button", { name: "Próxima" }));
    await usuario.click(screen.getByRole("button", { name: "Anterior" }));

    expect(onProxima).toHaveBeenCalledTimes(1);
    expect(onAnterior).toHaveBeenCalledTimes(1);
  });
});
