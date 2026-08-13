import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PedidoRecebimentoDetailPage } from "./PedidoRecebimentoDetailPage";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { DialogProvider } from "@/context/DialogContext";
import { setToken, ApiError } from "@/api/client";
import { montarTokenFake } from "@/test/token";
import * as pedidosApi from "@/api/pedidosRecebimento";
import * as fornecedoresApi from "@/api/fornecedores";
import * as produtosApi from "@/api/produtos";
import * as localizacoesApi from "@/api/localizacoes";
import * as armazensApi from "@/api/armazens";
import type { PedidoRecebimento } from "@/api/pedidosRecebimento";
import type { Produto } from "@/types/produto";

const fornecedores = [{ id: "fornecedor-1", nome: "Fornecedor A", cnpj: null, contato: null }];
const produtos: Produto[] = [
  { id: "produto-1", sku: "SKU-1", nome: "Produto 1", descricao: null, categoriaId: "cat-1", unidadeMedida: "UN", codigoBarras: null, estoqueMinimo: 0 },
];
const localizacoes = [
  { id: "loc-1", armazemId: "armazem-1", corredor: "A1", prateleira: "P1", nivel: "N1", codigo: "A1-P1-N1" },
];
const armazens = [{ id: "armazem-1", nome: "Armazém Central", endereco: null }];

function pedidoBase(overrides: Partial<PedidoRecebimento> = {}): PedidoRecebimento {
  return {
    id: "pedido-1",
    fornecedorId: "fornecedor-1",
    status: "Pendente",
    dataPrevista: "2026-06-01T00:00:00Z",
    dataRecebimento: null,
    itens: [{ id: "item-1", produtoId: "produto-1", quantidadeEsperada: 10, quantidadeRecebida: 0 }],
    ...overrides,
  };
}

function mockarDependencias(pedido: PedidoRecebimento) {
  vi.spyOn(pedidosApi, "obterPedidoRecebimento").mockResolvedValue(pedido);
  vi.spyOn(fornecedoresApi, "listarFornecedores").mockResolvedValue(fornecedores);
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
          <MemoryRouter initialEntries={["/pedidos-recebimento/pedido-1"]}>
            <Routes>
              <Route path="/pedidos-recebimento/:id" element={<PedidoRecebimentoDetailPage />} />
            </Routes>
          </MemoryRouter>
        </DialogProvider>
      </ToastProvider>
    </AuthProvider>,
  );
}

describe("PedidoRecebimentoDetailPage", () => {
  it("renderiza o fornecedor e o status do pedido", async () => {
    mockarDependencias(pedidoBase());
    renderPagina();

    expect(await screen.findByText("Fornecedor A")).toBeInTheDocument();
    expect(screen.getByText("Pendente")).toBeInTheDocument();
  });

  it("confirma o recebimento de um item com quantidade e localização, e mostra sucesso", async () => {
    mockarDependencias(pedidoBase());
    vi.spyOn(pedidosApi, "confirmarRecebimentoItem").mockResolvedValue(undefined);
    const usuario = userEvent.setup();
    renderPagina();

    await screen.findByText("Fornecedor A");
    await usuario.type(screen.getByLabelText("Qtd."), "10");
    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() =>
      expect(pedidosApi.confirmarRecebimentoItem).toHaveBeenCalledWith("pedido-1", "item-1", {
        quantidadeRecebida: 10,
        localizacaoId: "loc-1",
        usuarioId: "usuario-1",
      }),
    );
    expect(await screen.findByText("Recebimento confirmado e estoque atualizado.")).toBeInTheDocument();
  });

  it("bloqueia a confirmação sem quantidade informada, sem chamar a API", async () => {
    mockarDependencias(pedidoBase());
    const confirmarSpy = vi.spyOn(pedidosApi, "confirmarRecebimentoItem");
    const usuario = userEvent.setup();
    renderPagina();

    await screen.findByText("Fornecedor A");
    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Informe uma quantidade recebida maior que zero.",
    );
    expect(confirmarSpy).not.toHaveBeenCalled();
  });

  it("item já completo mostra 'Completo' em vez do formulário de confirmação", async () => {
    mockarDependencias(
      pedidoBase({
        itens: [{ id: "item-1", produtoId: "produto-1", quantidadeEsperada: 10, quantidadeRecebida: 10 }],
      }),
    );
    renderPagina();

    expect(await screen.findByText("Completo")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirmar" })).not.toBeInTheDocument();
  });

  it("pedido Concluido esconde a coluna de confirmação e o botão de cancelar", async () => {
    mockarDependencias(pedidoBase({ status: "Concluido" }));
    renderPagina();

    await screen.findByText("Fornecedor A");
    expect(screen.queryByRole("button", { name: "Confirmar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar pedido" })).not.toBeInTheDocument();
  });

  it("cancela o pedido após confirmação do usuário", async () => {
    mockarDependencias(pedidoBase());
    vi.spyOn(pedidosApi, "cancelarPedidoRecebimento").mockResolvedValue(undefined);
    const usuario = userEvent.setup();
    renderPagina();

    await screen.findByText("Fornecedor A");
    await usuario.click(screen.getByRole("button", { name: "Cancelar pedido" }));
    const dialogo = await screen.findByRole("dialog");
    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar pedido" }));

    await waitFor(() => expect(pedidosApi.cancelarPedidoRecebimento).toHaveBeenCalledWith("pedido-1"));
    expect(await screen.findByText("Pedido cancelado.")).toBeInTheDocument();
  });

  it("não cancela se o usuário recusar a confirmação no diálogo", async () => {
    mockarDependencias(pedidoBase());
    const cancelarSpy = vi.spyOn(pedidosApi, "cancelarPedidoRecebimento");
    const usuario = userEvent.setup();
    renderPagina();

    await screen.findByText("Fornecedor A");
    await usuario.click(screen.getByRole("button", { name: "Cancelar pedido" }));
    const dialogo = await screen.findByRole("dialog");
    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar" }));

    expect(cancelarSpy).not.toHaveBeenCalled();
  });

  it("mostra erro da API ao falhar a confirmação do item", async () => {
    mockarDependencias(pedidoBase());
    vi.spyOn(pedidosApi, "confirmarRecebimentoItem").mockRejectedValue(
      new ApiError("Localização inválida.", 400),
    );
    const usuario = userEvent.setup();
    renderPagina();

    await screen.findByText("Fornecedor A");
    await usuario.type(screen.getByLabelText("Qtd."), "5");
    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Localização inválida.");
  });
});
