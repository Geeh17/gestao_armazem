import { useEffect, useState } from "react";
import { listarProdutos } from "@/api/produtos";
import { listarLocalizacoes, type Localizacao } from "@/api/localizacoes";
import { listarArmazens, type Armazem } from "@/api/armazens";
import { consultarEstoquePorProduto, type SaldoEstoque } from "@/api/estoque";
import { ApiError } from "@/api/client";
import { formatarLocalizacao } from "@/lib/localizacao";
import type { Produto } from "@/types/produto";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";

export function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([]);
  const [armazens, setArmazens] = useState<Armazem[]>([]);
  const [produtoId, setProdutoId] = useState("");
  const [saldos, setSaldos] = useState<SaldoEstoque[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [consultando, setConsultando] = useState(false);

  useEffect(() => {
    Promise.all([listarProdutos(), listarLocalizacoes(), listarArmazens()])
      .then(([produtosData, localizacoesData, armazensData]) => {
        setProdutos(produtosData);
        setLocalizacoes(localizacoesData);
        setArmazens(armazensData);
        if (produtosData.length > 0) setProdutoId(produtosData[0].id);
      })
      .catch(() => setErro("Não foi possível carregar produtos e localizações."));
  }, []);

  useEffect(() => {
    if (!produtoId) return;

    setConsultando(true);
    setErro(null);

    consultarEstoquePorProduto(produtoId)
      .then(setSaldos)
      .catch((err) => setErro(err instanceof ApiError ? err.message : "Erro ao consultar o estoque."))
      .finally(() => setConsultando(false));
  }, [produtoId]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Estoque</h1>
        <p className="text-sm text-muted">Saldo por produto e localização.</p>
      </div>

      <div className="max-w-sm">
        <Select label="Produto" value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
          {produtos.length === 0 && <option value="">Nenhum produto cadastrado</option>}
          {produtos.map((produto) => (
            <option key={produto.id} value={produto.id}>
              {produto.nome} ({produto.sku})
            </option>
          ))}
        </Select>
      </div>

      {erro && <Alert>{erro}</Alert>}

      {!erro && consultando && <p className="text-sm text-muted">Consultando saldo...</p>}

      {!erro && !consultando && saldos !== null && saldos.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-surface-raised p-10 text-center">
          <p className="text-sm font-medium text-ink">Sem saldo para este produto.</p>
          <p className="mt-1 text-sm text-muted">
            Registre uma entrada em Movimentações para começar a ter estoque dele.
          </p>
        </div>
      )}

      {!erro && !consultando && saldos !== null && saldos.length > 0 && (
        <div className="max-w-lg overflow-hidden rounded-lg border border-border bg-surface-raised">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Localização</th>
                <th className="px-4 py-3 font-medium">Quantidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {saldos.map((saldo) => (
                <tr key={saldo.localizacaoId} className="hover:bg-surface">
                  <td className="px-4 py-3 font-data text-ink">
                    {formatarLocalizacao(saldo.localizacaoId, localizacoes, armazens)}
                  </td>
                  <td className="px-4 py-3 font-data text-ink">{saldo.quantidade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
