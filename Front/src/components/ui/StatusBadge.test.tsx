import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it.each([
    ["Pendente", "Pendente"],
    ["EmAndamento", "Em andamento"],
    ["Concluido", "Concluído"],
    ["Cancelado", "Cancelado"],
  ] as const)("traduz o status %s para o rótulo '%s'", (status, rotuloEsperado) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(rotuloEsperado)).toBeInTheDocument();
  });
});
