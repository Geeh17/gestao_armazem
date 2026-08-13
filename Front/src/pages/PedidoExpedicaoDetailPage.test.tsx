import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PedidoExpedicaoDetailPage } from "./PedidoExpedicaoDetailPage";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { DialogProvider } from "@/context/DialogContext";
import { setToken, ApiError } from "@/api/client";
import { montarTokenFake } from "@/test/token";
import * as pedidosApi from "@/api/pedidosExpedicao";
import * as clientesApi from "@/api/clientes";
import * as produtosApi from "@/api/produtos";
import * as localizacoesApi from "@/api/localizacoes";
import * as armazensApi from "@/api/armazens";
import type { PedidoExpedicao } from "@/api/pedidosExpedicao";
import type { Produto } from "@/types/produto";

const clientes = [{ id: "cliente-1", nome: "Cliente A", documento: null, contato: null }];
const produtos: Produto[] = [
  { id: "produto-1", sku: "SKU-1", nome: "Produto 1", descricao: null, categoriaId: "cat-1", unidadeMedida: "UN", codigoBarras: null, estoqueMinimo: 0 },
  { id: "produto-2", sku: "SKU-2", nome: "Produto 2", descricao: null, categoriaId: "cat-1", unidadeMedida: "UN", codigoBarras: null, estoqueMinimo: 0 },
];
const localizacoes = [
  { id: "loc-1", armazemId: "armazem-1", corredor: "A1", prateleira: "P1", nivel: "N1", codigo: "A1-P1-N1" },
];
const armazens = [{ id: "armazem-1", nome: "Armazém Central", endereco: null }];

function pedidoBase(overrides: Partial<PedidoExpedicao> = {}): PedidoExpedicao {
  return {
    id: "pedido-1",
    clienteId: "cliente-1",
    status: "Pendente",
    dataPrevista: "2026-06-01T00:00:00Z",
    dataExpedicao: null,
    itens: [
      { id: "item-1", produtoId: "produto-1", quantidadeSolicitada: 5, quantidadeExpedida: 0 },
      { id: "item-2", produtoId: "produto-2", quantidadeSolicitada: 3, quantidadeExpedida: 0 },
    ],
    ...overrides,
  };
}

function mockarDependencias(pedido: PedidoExpedicao) {
  vi.spyOn(pedidosApi, "obterPedidoExpedicao").mockResolvedValue(pedido);
  vi.spyOn(clientesApi, "listarClientes").mockResolvedValue(clientes);
  vi.spyOn(produtosApi, "listarProdutos").mockResolvedValue(produtos);
  vi.spyOn(localizacoesApi, "listarLocalizacoes").mockResolvedValue(localizacoes);
  vi.spyOn(armazensApi, "listarArmazens").mockResolvedValue(armazens);
}

function renderPagina() {
  setToken(montarTokenFake({ sub: "usuario-1", role: "Gestor de Estoque" }));
  return render(
    <AuthProvider>
      <ToastProvider>
        <DialogProvider>
          <MemoryRouter initialEntries={["/pedidos-expedicao/pedido-1"]}>
            <Routes>
              <Route path="/pedidos-expedicao/:id" element={<PedidoExpedicaoDetailPage />} />
            </Routes>
          </MemoryRouter>
        </DialogProvider>
      </ToastProvider>
    </AuthProvider>,
  );
}

describe("PedidoExpedicaoDetailPage", () => {
  it("renderiza o cliente, o status e o aviso de tudo-ou-nada (RN06)", async () => {
    mockarDependencias(pedidoBase());
    renderPagina();

    expect(await screen.findByText("Cliente A")).toBeInTheDocument();
    expect(screen.getByText("Pendente")).toBeInTheDocument();
    expect(screen.getByText(/A expedição é tudo ou nada/)).toBeInTheDocument();
  });

  it("expedir envia TODOS os itens do pedido de uma vez, com a localização de cada um", async () => {
    mockarDependencias(pedidoBase());
    vi.spyOn(pedidosApi, "expedirPedido").mockResolvedValue(undefined);
    const usuario = userEvent.setup();
    renderPagina();

    await screen.findByText("Cliente A");
    await usuario.click(screen.getByRole("button", { name: "Expedir pedido" }));

    await waitFor(() =>
      expect(pedidosApi.expedirPedido).toHaveBeenCalledWith("pedido-1", {
        itens: [
          { itemId: "item-1", localizacaoId: "loc-1" },
          { itemId: "item-2", localizacaoId: "loc-1" },
        ],
        usuarioId: "usuario-1",
      }),
    );
    expect(await screen.findByText("Pedido expedido com sucesso.")).toBeInTheDocument();
  });

  it("mostra o erro da RN06 (saldo insuficiente) sem marcar sucesso", async () => {
    mockarDependencias(pedidoBase());
    vi.spyOn(pedidosApi, "expedirPedido").mockRejectedValue(
      new ApiError("Saldo insuficiente do produto na localização.", 422),
    );
    const usuario = userEvent.setup();
    renderPagina();

    await screen.findByText("Cliente A");
    await usuario.click(screen.getByRole("button", { name: "Expedir pedido" }));

    expect(
      await screen.findByText("Saldo insuficiente do produto na localização."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Pedido expedido com sucesso.")).not.toBeInTheDocument();
  });

  it("pedido Concluido esconde o botão de expedir, o de cancelar, e o aviso de tudo-ou-nada", async () => {
    mockarDependencias(pedidoBase({ status: "Concluido" }));
    renderPagina();

    await screen.findByText("Cliente A");
    expect(screen.queryByRole("button", { name: "Expedir pedido" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar pedido" })).not.toBeInTheDocument();
    expect(screen.queryByText(/A expedição é tudo ou nada/)).not.toBeInTheDocument();
  });

  it("cancela o pedido após confirmação do usuário", async () => {
    mockarDependencias(pedidoBase());
    vi.spyOn(pedidosApi, "cancelarPedidoExpedicao").mockResolvedValue(undefined);
    const usuario = userEvent.setup();
    renderPagina();

    await screen.findByText("Cliente A");
    await usuario.click(screen.getByRole("button", { name: "Cancelar pedido" }));
    const dialogo = await screen.findByRole("dialog");
    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar pedido" }));

    await waitFor(() => expect(pedidosApi.cancelarPedidoExpedicao).toHaveBeenCalledWith("pedido-1"));
    expect(await screen.findByText("Pedido cancelado.")).toBeInTheDocument();
  });
});
