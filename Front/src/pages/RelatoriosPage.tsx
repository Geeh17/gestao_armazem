import { useEffect, useState } from "react";
import {
  listarEstoqueBaixo,
  listarMovimentacoesRelatorio,
  type EstoqueBaixo,
  type MovimentacaoRelatorio,
  type TipoMovimentacao,
} from "@/api/relatorios";
import { listarProdutos } from "@/api/produtos";
import { listarLocalizacoes, type Localizacao } from "@/api/localizacoes";
import { listarArmazens, type Armazem } from "@/api/armazens";
import { ApiError } from "@/api/client";
import { formatarLocalizacao } from "@/lib/localizacao";
import type { Produto } from "@/types/produto";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

type Aba = "estoque-baixo" | "movimentacoes";

const TIPOS: { valor: TipoMovimentacao; label: string }[] = [
  { valor: "Entrada", label: "Entrada" },
  { valor: "Saida", label: "Saída" },
  { valor: "Transferencia", label: "Transferência" },
  { valor: "Ajuste", label: "Ajuste" },
];

export function RelatoriosPage() {
  const [aba, setAba] = useState<Aba>("estoque-baixo");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Relatórios</h1>
        <p className="text-sm text-muted">Consultas agregadas sobre estoque e movimentações.</p>
      </div>

      <div className="flex gap-1 border-b border-border">
        <button
          type="button"
          onClick={() => setAba("estoque-baixo")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            aba === "estoque-baixo" ? "border-b-2 border-brand text-brand" : "text-muted hover:text-ink"
          }`}
        >
          Estoque baixo
        </button>
        <button
          type="button"
          onClick={() => setAba("movimentacoes")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            aba === "movimentacoes" ? "border-b-2 border-brand text-brand" : "text-muted hover:text-ink"
          }`}
        >
          Movimentações
        </button>
      </div>

      {aba === "estoque-baixo" ? <EstoqueBaixoTab /> : <MovimentacoesTab />}
    </div>
  );
}

function EstoqueBaixoTab() {
  const [itens, setItens] = useState<EstoqueBaixo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarEstoqueBaixo()
      .then(setItens)
      .catch((err) => setErro(err instanceof ApiError ? err.message : "Erro ao carregar o relatório."));
  }, []);

  if (erro) return <Alert>{erro}</Alert>;
  if (itens === null) return <p className="text-sm text-muted">Carregando...</p>;

  if (itens.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface-raised p-10 text-center">
        <p className="text-sm font-medium text-ink">Nenhum produto abaixo do estoque mínimo.</p>
        <p className="mt-1 text-sm text-muted">Todos os produtos estão com saldo adequado.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-raised">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">SKU</th>
            <th className="px-4 py-3 font-medium">Produto</th>
            <th className="px-4 py-3 font-medium">Saldo atual</th>
            <th className="px-4 py-3 font-medium">Estoque mínimo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {itens.map((item) => (
            <tr key={item.produtoId} className="hover:bg-surface">
              <td className="px-4 py-3 font-data text-ink">{item.sku}</td>
              <td className="px-4 py-3 text-ink">{item.nome}</td>
              <td className="px-4 py-3 font-data text-danger">{item.saldoTotal}</td>
              <td className="px-4 py-3 font-data text-muted">{item.estoqueMinimo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MovimentacoesTab() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([]);
  const [armazens, setArmazens] = useState<Armazem[]>([]);
  const [produtoId, setProdutoId] = useState("");
  const [tipo, setTipo] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoRelatorio[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [consultando, setConsultando] = useState(false);

  useEffect(() => {
    Promise.all([listarProdutos(), listarLocalizacoes(), listarArmazens()]).then(
      ([produtosData, localizacoesData, armazensData]) => {
        setProdutos(produtosData);
        setLocalizacoes(localizacoesData);
        setArmazens(armazensData);
      },
    );
    consultar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function produtoLabel(id: string): string {
    const produto = produtos.find((p) => p.id === id);
    return produto ? `${produto.nome} (${produto.sku})` : id;
  }

  function consultar() {
    setConsultando(true);
    setErro(null);

    listarMovimentacoesRelatorio({
      produtoId: produtoId || undefined,
      tipo: (tipo as TipoMovimentacao) || undefined,
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
    })
      .then(setMovimentacoes)
      .catch((err) => setErro(err instanceof ApiError ? err.message : "Erro ao carregar o relatório."))
      .finally(() => setConsultando(false));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface-raised p-4">
        <div className="w-56">
          <Select label="Produto" value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
            <option value="">Todos</option>
            {produtos.map((produto) => (
              <option key={produto.id} value={produto.id}>
                {produto.nome} ({produto.sku})
              </option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <Select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos</option>
            {TIPOS.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <Input label="De" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </div>
        <div className="w-40">
          <Input label="Até" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </div>
        <Button type="button" onClick={consultar} isLoading={consultando}>
          Filtrar
        </Button>
      </div>

      {erro && <Alert>{erro}</Alert>}

      {!erro && movimentacoes !== null && movimentacoes.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-surface-raised p-10 text-center">
          <p className="text-sm font-medium text-ink">Nenhuma movimentação encontrada com esses filtros.</p>
        </div>
      )}

      {!erro && movimentacoes !== null && movimentacoes.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-surface-raised">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Origem</th>
                <th className="px-4 py-3 font-medium">Destino</th>
                <th className="px-4 py-3 font-medium">Quantidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {movimentacoes.map((mov) => (
                <tr key={mov.id} className="hover:bg-surface">
                  <td className="px-4 py-3 font-data text-muted">
                    {new Date(mov.data).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-ink">{mov.tipo}</td>
                  <td className="px-4 py-3 text-ink">{produtoLabel(mov.produtoId)}</td>
                  <td className="px-4 py-3 font-data text-muted">
                    {formatarLocalizacao(mov.localizacaoOrigemId, localizacoes, armazens)}
                  </td>
                  <td className="px-4 py-3 font-data text-muted">
                    {formatarLocalizacao(mov.localizacaoDestinoId, localizacoes, armazens)}
                  </td>
                  <td className="px-4 py-3 font-data text-ink">{mov.quantidade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
