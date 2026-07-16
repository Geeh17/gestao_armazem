import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listarProdutos } from "@/api/produtos";
import { ApiError } from "@/api/client";
import type { Produto } from "@/types/produto";
import { Alert } from "@/components/ui/Alert";

export function ProdutosListPage() {
  const [produtos, setProdutos] = useState<Produto[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    listarProdutos()
      .then((dados) => {
        if (!cancelado) setProdutos(dados);
      })
      .catch((err) => {
        if (!cancelado) {
          setErro(err instanceof ApiError ? err.message : "Não foi possível carregar os produtos.");
        }
      });

    return () => {
      cancelado = true;
    };
  }, []);

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
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {produtos.map((produto) => (
                <tr key={produto.id} className="hover:bg-surface">
                  <td className="px-4 py-3 font-data text-ink">{produto.sku}</td>
                  <td className="px-4 py-3 text-ink">{produto.nome}</td>
                  <td className="px-4 py-3 font-data text-muted">{produto.unidadeMedida}</td>
                  <td className="px-4 py-3 font-data text-muted">{produto.estoqueMinimo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
