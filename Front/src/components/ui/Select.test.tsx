import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "./Select";

describe("Select", () => {
  it("associa o label ao campo e lista as opções", () => {
    render(
      <Select label="Categoria" value="" onChange={() => {}}>
        <option value="cat-1">Eletrônicos</option>
        <option value="cat-2">Embalagens</option>
      </Select>,
    );

    const select = screen.getByLabelText("Categoria");
    expect(select).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Eletrônicos" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Embalagens" })).toBeInTheDocument();
  });

  it("dispara onChange ao trocar a opção selecionada", async () => {
    const aoMudar = vi.fn();
    const usuario = userEvent.setup();

    render(
      <Select label="Armazém" defaultValue="arm-1" onChange={aoMudar}>
        <option value="arm-1">Armazém Central</option>
        <option value="arm-2">Armazém Filial</option>
      </Select>,
    );

    await usuario.selectOptions(screen.getByLabelText("Armazém"), "arm-2");

    expect(aoMudar).toHaveBeenCalled();
  });

  it("mostra a mensagem de erro quando informada", () => {
    render(
      <Select label="Perfil" value="" onChange={() => {}} error="Selecione um perfil">
        <option value="">-</option>
      </Select>,
    );

    expect(screen.getByText("Selecione um perfil")).toBeInTheDocument();
    expect(screen.getByLabelText("Perfil")).toHaveAttribute("aria-invalid", "true");
  });
});
