import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Alert } from "./Alert";

describe("Alert", () => {
  it("renderiza o conteúdo com role='alert' (variant padrão danger)", () => {
    render(<Alert>Não foi possível salvar o produto.</Alert>);

    const alerta = screen.getByRole("alert");
    expect(alerta).toHaveTextContent("Não foi possível salvar o produto.");
    expect(alerta).toHaveClass("text-danger");
  });

  it("aplica o estilo de success quando variant='success'", () => {
    render(<Alert variant="success">Produto cadastrado.</Alert>);
    expect(screen.getByRole("alert")).toHaveClass("text-success");
  });
});
