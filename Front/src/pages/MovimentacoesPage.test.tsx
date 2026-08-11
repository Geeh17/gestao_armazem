import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MovimentacoesPage } from "./MovimentacoesPage";
import { AuthProvider } from "@/context/AuthContext";
import { setToken } from "@/api/client";
import { montarTokenFake } from "@/test/token";
import * as produtosApi from "@/api/produtos";
import * as localizacoesApi from "@/api/localizacoes";
import * as armazensApi from "@/api/armazens";
import * as movimentacoesApi from "@/api/movimentacoes";
import * as estoqueApi from "@/api/estoque";
import type { Produto } from "@/types/produto";

const produtos: Produto[] = [
  {
    id: "produto-1",
    sku: "SKU-1",
    nome: "Produto 1",
    descricao: null,
    categoriaId: "cat-1",
    unidadeMedida: "UN",
    codigoBarras: null,
    estoqueMinimo: 0,
  },
];

const localizacoes = [
  { id: "loc-1", armazemId: "armazem-1", corredor: "A1", prateleira: "P1", nivel: "N1", codigo: "A1-P1-N1" },
];

const armazens = [{ id: "armazem-1", nome: "Armazém Central", endereco: null }];

function mockarCarregamentoInicial() {
  vi.spyOn(produtosApi, "listarProdutos").mockResolvedValue(produtos);
  vi.spyOn(localizacoesApi, "listarLocalizacoes").mockResolvedValue(localizacoes);
  vi.spyOn(armazensApi, "listarArmazens").mockResolvedValue(armazens);
  vi.spyOn(estoqueApi, "consultarEstoquePorProduto").mockResolvedValue([
    { produtoId: "produto-1", localizacaoId: "loc-1", quantidade: 20 },
  ]);
}

function renderPagina() {
  setToken(montarTokenFake({ sub: "usuario-1", role: "Operador de Armazem" }));
  return render(
    <AuthProvider>
      <MovimentacoesPage />
    </AuthProvider>,
  );
}

describe("MovimentacoesPage", () => {
  it("começa na aba Entrada, mostrando 'Localização de destino'", async () => {
    mockarCarregamentoInicial();
    renderPagina();

    expect(await screen.findByLabelText("Localização de destino")).toBeInTheDocument();
    expect(screen.queryByLabelText("Localização de origem")).not.toBeInTheDocument();
  });

  it("aba Saída mostra só 'Localização de origem'", async () => {
    mockarCarregamentoInicial();
    const usuario = userEvent.setup();
    renderPagina();

    await screen.findByLabelText("Localização de destino");
    await usuario.click(screen.getByRole("button", { name: "Saída" }));

    expect(screen.getByLabelText("Localização de origem")).toBeInTheDocument();
    expect(screen.queryByLabelText("Localização de destino")).not.toBeInTheDocument();
  });

  it("aba Transferência mostra origem E destino ao mesmo tempo", async () => {
    mockarCarregamentoInicial();
    const usuario = userEvent.setup();
    renderPagina();

    await screen.findByLabelText("Localização de destino");
    await usuario.click(screen.getByRole("button", { name: "Transferência" }));

    expect(screen.getByLabelText("Localização de origem")).toBeInTheDocument();
    expect(screen.getByLabelText("Localização de destino")).toBeInTheDocument();
  });

  it("submeter na aba Entrada chama registrarEntrada com o payload certo", async () => {
    mockarCarregamentoInicial();
    vi.spyOn(movimentacoesApi, "registrarEntrada").mockResolvedValue(undefined);
    const usuario = userEvent.setup();
    renderPagina();

    await screen.findByLabelText("Localização de destino");
    await usuario.click(screen.getByRole("button", { name: "Registrar entrada" }));

    await waitFor(() =>
      expect(movimentacoesApi.registrarEntrada).toHaveBeenCalledWith({
        produtoId: "produto-1",
        localizacaoId: "loc-1",
        quantidade: 1,
        usuarioId: "usuario-1",
      }),
    );
    expect(await screen.findByText("Entrada registrada e saldo atualizado.")).toBeInTheDocument();
  });

  it("submeter na aba Transferência chama registrarTransferencia (não entrada/saída)", async () => {
    mockarCarregamentoInicial();
    vi.spyOn(movimentacoesApi, "registrarTransferencia").mockResolvedValue(undefined);
    const registrarEntradaSpy = vi.spyOn(movimentacoesApi, "registrarEntrada");
    const usuario = userEvent.setup();
    renderPagina();

    await screen.findByLabelText("Localização de destino");
    await usuario.click(screen.getByRole("button", { name: "Transferência" }));
    await usuario.click(screen.getByRole("button", { name: "Registrar transferência" }));

    await waitFor(() =>
      expect(movimentacoesApi.registrarTransferencia).toHaveBeenCalledWith({
        produtoId: "produto-1",
        localizacaoOrigemId: "loc-1",
        localizacaoDestinoId: "loc-1",
        quantidade: 1,
        usuarioId: "usuario-1",
      }),
    );
    expect(registrarEntradaSpy).not.toHaveBeenCalled();
  });

  it("mostra o erro da API quando a movimentação falha (ex.: saldo insuficiente)", async () => {
    mockarCarregamentoInicial();
    const { ApiError } = await import("@/api/client");
    vi.spyOn(movimentacoesApi, "registrarSaida").mockRejectedValue(
      new ApiError("Saldo insuficiente do produto na localização.", 422),
    );
    const usuario = userEvent.setup();
    renderPagina();

    await screen.findByLabelText("Localização de destino");
    await usuario.click(screen.getByRole("button", { name: "Saída" }));
    await usuario.click(screen.getByRole("button", { name: "Registrar saída" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Saldo insuficiente do produto na localização.",
    );
  });

  it("aba Ajuste mostra 'Quantidade contada' (não 'Quantidade') e o saldo atual do sistema", async () => {
    mockarCarregamentoInicial();
    const usuario = userEvent.setup();
    renderPagina();

    await screen.findByLabelText("Localização de destino");
    await usuario.click(screen.getByRole("button", { name: "Ajuste" }));

    expect(await screen.findByText("Saldo atual do sistema: 20")).toBeInTheDocument();
    expect(screen.getByLabelText("Quantidade contada")).toBeInTheDocument();
    expect(screen.queryByLabelText("Quantidade")).not.toBeInTheDocument();
  });

  it("submeter na aba Ajuste chama registrarAjuste com quantidadeContada (não 'quantidade')", async () => {
    mockarCarregamentoInicial();
    vi.spyOn(movimentacoesApi, "registrarAjuste").mockResolvedValue(undefined);
    const usuario = userEvent.setup();
    renderPagina();

    await screen.findByLabelText("Localização de destino");
    await usuario.click(screen.getByRole("button", { name: "Ajuste" }));
    await screen.findByText("Saldo atual do sistema: 20");

    await usuario.clear(screen.getByLabelText("Quantidade contada"));
    await usuario.type(screen.getByLabelText("Quantidade contada"), "15");
    await usuario.click(screen.getByRole("button", { name: "Registrar ajuste" }));

    await waitFor(() =>
      expect(movimentacoesApi.registrarAjuste).toHaveBeenCalledWith({
        produtoId: "produto-1",
        localizacaoId: "loc-1",
        quantidadeContada: 15,
        usuarioId: "usuario-1",
      }),
    );
    expect(await screen.findByText("Ajuste registrado e saldo corrigido.")).toBeInTheDocument();
  });
});
