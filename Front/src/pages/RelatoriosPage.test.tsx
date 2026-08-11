import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RelatoriosPage } from "./RelatoriosPage";
import * as relatoriosApi from "@/api/relatorios";
import * as produtosApi from "@/api/produtos";
import * as localizacoesApi from "@/api/localizacoes";
import * as armazensApi from "@/api/armazens";
import type { Produto } from "@/types/produto";

const produtos: Produto[] = [
  { id: "produto-1", sku: "SKU-1", nome: "Produto 1", descricao: null, categoriaId: "cat-1", unidadeMedida: "UN", codigoBarras: null, estoqueMinimo: 0 },
];
const localizacoes = [
  { id: "loc-1", armazemId: "armazem-1", corredor: "A1", prateleira: "P1", nivel: "N1", codigo: "A1-P1-N1" },
];
const armazens = [{ id: "armazem-1", nome: "Armazém Central", endereco: null }];

function mockarDependenciasComuns() {
  vi.spyOn(produtosApi, "listarProdutos").mockResolvedValue(produtos);
  vi.spyOn(localizacoesApi, "listarLocalizacoes").mockResolvedValue(localizacoes);
  vi.spyOn(armazensApi, "listarArmazens").mockResolvedValue(armazens);
}

describe("RelatoriosPage", () => {
  it("começa na aba 'Estoque baixo' e mostra os itens", async () => {
    vi.spyOn(relatoriosApi, "listarEstoqueBaixo").mockResolvedValue([
      { produtoId: "produto-1", sku: "SKU-1", nome: "Produto 1", saldoTotal: 2, estoqueMinimo: 10 },
    ]);
    mockarDependenciasComuns();
    vi.spyOn(relatoriosApi, "listarMovimentacoesRelatorio").mockResolvedValue([]);
    render(<RelatoriosPage />);

    expect(await screen.findByText("SKU-1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("mostra o estado vazio na aba 'Estoque baixo' quando nada está abaixo do mínimo", async () => {
    vi.spyOn(relatoriosApi, "listarEstoqueBaixo").mockResolvedValue([]);
    render(<RelatoriosPage />);

    expect(await screen.findByText("Nenhum produto abaixo do estoque mínimo.")).toBeInTheDocument();
  });

  it("trocar para a aba 'Movimentações' consulta automaticamente sem filtros", async () => {
    vi.spyOn(relatoriosApi, "listarEstoqueBaixo").mockResolvedValue([]);
    mockarDependenciasComuns();
    vi.spyOn(relatoriosApi, "listarMovimentacoesRelatorio").mockResolvedValue([]);
    const usuario = userEvent.setup();
    render(<RelatoriosPage />);

    await screen.findByText("Nenhum produto abaixo do estoque mínimo.");
    await usuario.click(screen.getByRole("button", { name: "Movimentações" }));

    await waitFor(() => expect(relatoriosApi.listarMovimentacoesRelatorio).toHaveBeenCalled());
  });

  it("o botão 'Filtrar' consulta de novo com os filtros preenchidos (não busca a cada tecla)", async () => {
    vi.spyOn(relatoriosApi, "listarEstoqueBaixo").mockResolvedValue([]);
    mockarDependenciasComuns();
    vi.spyOn(relatoriosApi, "listarMovimentacoesRelatorio").mockResolvedValue([]);
    const usuario = userEvent.setup();
    render(<RelatoriosPage />);

    await screen.findByText("Nenhum produto abaixo do estoque mínimo.");
    await usuario.click(screen.getByRole("button", { name: "Movimentações" }));
    await waitFor(() => expect(relatoriosApi.listarMovimentacoesRelatorio).toHaveBeenCalledTimes(1));

    await usuario.selectOptions(screen.getByLabelText("Tipo"), "Entrada");
    // A troca do select sozinha não deve disparar uma nova consulta.
    expect(relatoriosApi.listarMovimentacoesRelatorio).toHaveBeenCalledTimes(1);

    await usuario.click(screen.getByRole("button", { name: "Filtrar" }));

    await waitFor(() =>
      expect(relatoriosApi.listarMovimentacoesRelatorio).toHaveBeenLastCalledWith(
        expect.objectContaining({ tipo: "Entrada" }),
      ),
    );
  });

  it("mostra as movimentações retornadas com produto e localização formatados", async () => {
    vi.spyOn(relatoriosApi, "listarEstoqueBaixo").mockResolvedValue([]);
    mockarDependenciasComuns();
    vi.spyOn(relatoriosApi, "listarMovimentacoesRelatorio").mockResolvedValue([
      {
        id: "mov-1",
        produtoId: "produto-1",
        localizacaoOrigemId: null,
        localizacaoDestinoId: "loc-1",
        quantidade: 10,
        tipo: "Entrada",
        data: "2026-06-01T10:00:00Z",
        usuarioId: "usuario-1",
      },
    ]);
    const usuario = userEvent.setup();
    render(<RelatoriosPage />);

    await screen.findByText("Nenhum produto abaixo do estoque mínimo.");
    await usuario.click(screen.getByRole("button", { name: "Movimentações" }));

    const tabela = await screen.findByRole("table");
    expect(within(tabela).getByText("Produto 1 (SKU-1)")).toBeInTheDocument();
    expect(within(tabela).getByText("Armazém Central - A1-P1-N1")).toBeInTheDocument();
  });
});
