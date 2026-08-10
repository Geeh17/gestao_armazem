import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./Input";

describe("Input", () => {
  it("associa o label ao campo (acessível por label)", () => {
    render(<Input label="Nome" value="" onChange={() => {}} />);
    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
  });

  it("dispara onChange ao digitar", async () => {
    const aoMudar = vi.fn();
    const usuario = userEvent.setup();

    function Wrapper() {
      return <Input label="SKU" defaultValue="" onChange={aoMudar} />;
    }
    render(<Wrapper />);

    await usuario.type(screen.getByLabelText("SKU"), "A");

    expect(aoMudar).toHaveBeenCalled();
  });

  it("mostra a mensagem de erro e marca aria-invalid", () => {
    render(<Input label="Email" value="" onChange={() => {}} error="Email inválido" />);

    expect(screen.getByText("Email inválido")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("não marca aria-invalid quando não há erro", () => {
    render(<Input label="Email" value="" onChange={() => {}} />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "false");
  });
});
