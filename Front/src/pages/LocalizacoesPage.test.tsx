import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderComProviders } from "@/test/providers";
import { LocalizacoesPage } from "./LocalizacoesPage";
import * as armazensApi from "@/api/armazens";
import * as localizacoesApi from "@/api/localizacoes";

const armazens = [
  { id: "armazem-1", nome: "Armazém Central", endereco: null },
  { id: "armazem-2", nome: "Armazém Filial", endereco: null },
];

const localizacoes = [
  { id: "loc-1", armazemId: "armazem-1", corredor: "A1", prateleira: "P1", nivel: "N1", codigo: "A1-P1-N1" },
  { id: "loc-2", armazemId: "armazem-2", corredor: "B1", prateleira: "P1", nivel: "N1", codigo: "B1-P1-N1" },
];

function mockarCarregamento() {
  vi.spyOn(armazensApi, "listarArmazens").mockResolvedValue(armazens);
  vi.spyOn(localizacoesApi, "listarLocalizacoes").mockResolvedValue(localizacoes);
}

describe("LocalizacoesPage", () => {
  it("mostra aviso para cadastrar um armazém primeiro quando não há nenhum", async () => {
    vi.spyOn(armazensApi, "listarArmazens").mockResolvedValue([]);
    vi.spyOn(localizacoesApi, "listarLocalizacoes").mockResolvedValue([]);
    renderComProviders(<LocalizacoesPage />);

    expect(await screen.findByText("Nenhum armazém cadastrado ainda.")).toBeInTheDocument();
  });

  it("lista todas as localizações de todos os armazéns por padrão", async () => {
    mockarCarregamento();
    renderComProviders(<LocalizacoesPage />);

    expect(await screen.findByText("A1-P1-N1")).toBeInTheDocument();
    expect(screen.getByText("B1-P1-N1")).toBeInTheDocument();
  });

  it("o filtro por armazém restringe a tabela a só esse armazém", async () => {
    mockarCarregamento();
    const usuario = userEvent.setup();
    renderComProviders(<LocalizacoesPage />);

    await screen.findByText("A1-P1-N1");
    await usuario.selectOptions(screen.getByLabelText("Filtrar por armazém"), "Armazém Filial");

    expect(screen.queryByText("A1-P1-N1")).not.toBeInTheDocument();
    expect(screen.getByText("B1-P1-N1")).toBeInTheDocument();
  });

  it("ao editar, o select de Armazém do formulário fica travado", async () => {
    mockarCarregamento();
    const usuario = userEvent.setup();
    renderComProviders(<LocalizacoesPage />);

    await screen.findByText("A1-P1-N1");
    await usuario.click(screen.getAllByRole("button", { name: "Editar" })[0]);

    expect(
      screen.getByText("O armazém não pode ser alterado — crie uma nova localização se precisar mudar."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Editar localização" })).toBeInTheDocument();
  });

  it("submete a edição via atualizarLocalizacao sem o campo armazemId", async () => {
    mockarCarregamento();
    vi.spyOn(localizacoesApi, "atualizarLocalizacao").mockResolvedValue({} as (typeof localizacoes)[0]);
    const usuario = userEvent.setup();
    renderComProviders(<LocalizacoesPage />);

    await screen.findByText("A1-P1-N1");
    await usuario.click(screen.getAllByRole("button", { name: "Editar" })[0]);
    await usuario.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() =>
      expect(localizacoesApi.atualizarLocalizacao).toHaveBeenCalledWith("loc-1", {
        corredor: "A1",
        prateleira: "P1",
        nivel: "N1",
        codigo: "A1-P1-N1",
      }),
    );
  });
});
