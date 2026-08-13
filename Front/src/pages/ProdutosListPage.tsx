import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { excluirProduto, listarProdutos } from "@/api/produtos";
import { ApiError } from "@/api/client";
import { useDialog } from "@/context/DialogContext";
import { useToast } from "@/context/ToastContext";
import type { Produto } from "@/types/produto";
import { Alert } from "@/components/ui/Alert";
import { Pagination } from "@/components/ui/Pagination";

const TAMANHO_PAGINA = 20;

export function ProdutosListPage() {
  const { confirmar } = useDialog();
  const { mostrarToast } = useToast();
  const [produtos, setProdutos] = useState<Produto[] | null>(null);
  const [pagina, setPagina] = useState(1);
  const [temProximaPagina, setTemProximaPagina] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  function carregar() {
    // Busca um item a mais que o tamanho da página só para saber se existe
    // próxima página — a API não retorna contagem total de registros.
    listarProdutos(pagina, TAMANHO_PAGINA + 1)
      .then((dados) => {
        setTemProximaPagina(dados.length > TAMANHO_PAGINA);
        setProdutos(dados.slice(0, TAMANHO_PAGINA));
      })
      .catch((err) => setErro(err instanceof ApiError ? err.message : "Não foi possível carregar os produtos."));
  }

  useEffect(carregar, [pagina]);

  async function handleExcluir(produto: Produto) {
    const confirmado = await confirmar({
      titulo: "Excluir produto",
      mensagem: `Excluir o produto "${produto.nome}"? Essa ação não pode ser desfeita.`,
      confirmarLabel: "Excluir",
      variantePerigo: true,
    });
    if (!confirmado) return;

    setErro(null);
    setExcluindoId(produto.id);
    try {
      await excluirProduto(produto.id);
      mostrarToast("Produto excluído.");
      carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível excluir o produto.");
    } finally {
      setExcluindoId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Produtos</h1>
          <p className="text-sm text-muted">Cadastro de produtos do armazém.</p>
        </div>
        <Link
          to="/produtos/novo"
          className="inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          Novo produto
        </Link>
      </div>

      {erro && <Alert>{erro}</Alert>}

      {!erro && produtos === null && (
        <p className="text-sm text-muted">Carregando produtos...</p>
      )}

      {produtos !== null && produtos.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-surface-raised p-10 text-center">
          <p className="text-sm font-medium text-ink">Nenhum produto cadastrado ainda.</p>
          <p className="mt-1 text-sm text-muted">
            Cadastre o primeiro produto para começar a controlar o estoque.
          </p>
        </div>
      )}

      {produtos !== null && produtos.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-surface-raised">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Unidade</th>
                <th className="px-4 py-3 font-medium">Estoque mínimo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {produtos.map((produto) => (
                <tr key={produto.id} className="hover:bg-surface">
                  <td className="px-4 py-3 font-data text-ink">{produto.sku}</td>
                  <td className="px-4 py-3 text-ink">{produto.nome}</td>
                  <td className="px-4 py-3 font-data text-muted">{produto.unidadeMedida}</td>
                  <td className="px-4 py-3 font-data text-muted">{produto.estoqueMinimo}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link
                        to={`/produtos/${produto.id}/editar`}
                        className="text-sm font-medium text-brand hover:underline"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleExcluir(produto)}
                        disabled={excluindoId === produto.id}
                        className="text-sm font-medium text-danger hover:underline disabled:opacity-50"
                      >
                        {excluindoId === produto.id ? "Excluindo..." : "Excluir"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {produtos !== null && produtos.length > 0 && (
        <Pagination
          pagina={pagina}
          temProximaPagina={temProximaPagina}
          onPaginaAnterior={() => setPagina((p) => Math.max(1, p - 1))}
          onProximaPagina={() => setPagina((p) => p + 1)}
        />
      )}
    </div>
  );
}
