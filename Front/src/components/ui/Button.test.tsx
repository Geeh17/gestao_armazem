import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("renderiza o texto e responde a clique", async () => {
    const aoClicar = vi.fn();
    const usuario = userEvent.setup();

    render(<Button onClick={aoClicar}>Salvar produto</Button>);

    const botao = screen.getByRole("button", { name: "Salvar produto" });
    await usuario.click(botao);

    expect(aoClicar).toHaveBeenCalledTimes(1);
  });

  it("fica desabilitado e não dispara onClick quando isLoading", async () => {
    const aoClicar = vi.fn();
    const usuario = userEvent.setup();

    render(
      <Button onClick={aoClicar} isLoading>
        Salvando...
      </Button>,
    );

    const botao = screen.getByRole("button");
    expect(botao).toBeDisabled();

    await usuario.click(botao);
    expect(aoClicar).not.toHaveBeenCalled();
  });

  it("respeita disabled explícito mesmo sem isLoading", () => {
    render(<Button disabled>Indisponível</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("aplica a classe do variant secondary", () => {
    render(<Button variant="secondary">Cancelar</Button>);
    expect(screen.getByRole("button")).toHaveClass("border-border");
  });
});
