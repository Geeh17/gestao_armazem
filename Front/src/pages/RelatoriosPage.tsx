import { useEffect, useState } from "react";
import {
  listarEstoqueBaixo,
  listarMovimentacoesRelatorio,
  listarPedidosRecebimentoRelatorio,
  listarPedidosExpedicaoRelatorio,
  type EstoqueBaixo,
  type MovimentacaoRelatorio,
  type TipoMovimentacao,
  type PedidoRecebimentoRelatorio,
  type PedidoExpedicaoRelatorio,
  type StatusPedido,
} from "@/api/relatorios";
import { listarProdutos } from "@/api/produtos";
import { listarLocalizacoes, type Localizacao } from "@/api/localizacoes";
import { listarArmazens, type Armazem } from "@/api/armazens";
import { listarFornecedores, type Fornecedor } from "@/api/fornecedores";
import { listarClientes, type Cliente } from "@/api/clientes";
import { ApiError } from "@/api/client";
import { formatarLocalizacao } from "@/lib/localizacao";
import { exportarExcel } from "@/lib/exportarExcel";
import type { Produto } from "@/types/produto";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/ui/StatusBadge";

type Aba = "estoque-baixo" | "movimentacoes" | "pedidos";

const TIPOS: { valor: TipoMovimentacao; label: string }[] = [
  { valor: "Entrada", label: "Entrada" },
  { valor: "Saida", label: "Saída" },
  { valor: "Transferencia", label: "Transferência" },
  { valor: "Ajuste", label: "Ajuste" },
];

const STATUS_PEDIDO: { valor: StatusPedido; label: string }[] = [
  { valor: "Pendente", label: "Pendente" },
  { valor: "EmAndamento", label: "Em andamento" },
  { valor: "Concluido", label: "Concluído" },
  { valor: "Cancelado", label: "Cancelado" },
];

export function RelatoriosPage() {
  const [aba, setAba] = useState<Aba>("estoque-baixo");

  const abas: { valor: Aba; label: string }[] = [
    { valor: "estoque-baixo", label: "Estoque baixo" },
    { valor: "movimentacoes", label: "Movimentações" },
    { valor: "pedidos", label: "Pedidos" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Relatórios</h1>
        <p className="text-sm text-muted">Consultas agregadas sobre estoque, movimentações e pedidos.</p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {abas.map((a) => (
          <button
            key={a.valor}
            type="button"
            onClick={() => setAba(a.valor)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              aba === a.valor ? "border-b-2 border-brand text-brand" : "text-muted hover:text-ink"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {aba === "estoque-baixo" && <EstoqueBaixoTab />}
      {aba === "movimentacoes" && <MovimentacoesTab />}
      {aba === "pedidos" && <PedidosTab />}
    </div>
  );
}

function BotaoExportar({ onClick, desabilitado }: { onClick: () => void; desabilitado: boolean }) {
  return (
    <Button type="button" variant="secondary" onClick={onClick} disabled={desabilitado}>
      Exportar Excel
    </Button>
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

  function exportar() {
    if (!itens) return;
    exportarExcel(
      itens.map((item) => ({
        SKU: item.sku,
        Produto: item.nome,
        "Saldo atual": item.saldoTotal,
        "Estoque mínimo": item.estoqueMinimo,
      })),
      "estoque-baixo",
      "Estoque baixo",
    );
  }

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
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <BotaoExportar onClick={exportar} desabilitado={itens.length === 0} />
      </div>
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

  function exportar() {
    if (!movimentacoes) return;
    exportarExcel(
      movimentacoes.map((mov) => ({
        Data: new Date(mov.data).toLocaleString("pt-BR"),
        Tipo: mov.tipo,
        Produto: produtoLabel(mov.produtoId),
        Origem: formatarLocalizacao(mov.localizacaoOrigemId, localizacoes, armazens),
        Destino: formatarLocalizacao(mov.localizacaoDestinoId, localizacoes, armazens),
        Quantidade: mov.quantidade,
      })),
      "movimentacoes",
      "Movimentações",
    );
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
        <div className="ml-auto">
          <BotaoExportar onClick={exportar} desabilitado={!movimentacoes || movimentacoes.length === 0} />
        </div>
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

type TipoPedido = "recebimento" | "expedicao";

function PedidosTab() {
  const [tipoPedido, setTipoPedido] = useState<TipoPedido>("recebimento");
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [parceiroId, setParceiroId] = useState("");
  const [status, setStatus] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [recebimentos, setRecebimentos] = useState<PedidoRecebimentoRelatorio[] | null>(null);
  const [expedicoes, setExpedicoes] = useState<PedidoExpedicaoRelatorio[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [consultando, setConsultando] = useState(false);

  useEffect(() => {
    Promise.all([listarFornecedores(), listarClientes()]).then(([fornecedoresData, clientesData]) => {
      setFornecedores(fornecedoresData);
      setClientes(clientesData);
    });
    consultar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function trocarTipoPedido(novoTipo: TipoPedido) {
    setTipoPedido(novoTipo);
    setParceiroId("");
    setStatus("");
    setErro(null);
  }

  function consultar() {
    setConsultando(true);
    setErro(null);

    const filtroComum = {
      status: (status as PedidoRecebimentoRelatorio["status"]) || undefined,
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
    };

    const requisicao =
      tipoPedido === "recebimento"
        ? listarPedidosRecebimentoRelatorio({ ...filtroComum, fornecedorId: parceiroId || undefined }).then(
            setRecebimentos,
          )
        : listarPedidosExpedicaoRelatorio({ ...filtroComum, clienteId: parceiroId || undefined }).then(
            setExpedicoes,
          );

    requisicao
      .catch((err) => setErro(err instanceof ApiError ? err.message : "Erro ao carregar o relatório."))
      .finally(() => setConsultando(false));
  }

  function exportar() {
    if (tipoPedido === "recebimento" && recebimentos) {
      exportarExcel(
        recebimentos.map((p) => ({
          Fornecedor: p.fornecedorNome,
          Status: p.status,
          "Data prevista": new Date(p.dataPrevista).toLocaleDateString("pt-BR"),
          "Data recebimento": p.dataRecebimento ? new Date(p.dataRecebimento).toLocaleDateString("pt-BR") : "—",
          "Qtd. itens": p.quantidadeItens,
        })),
        "pedidos-recebimento",
        "Pedidos de Recebimento",
      );
    } else if (tipoPedido === "expedicao" && expedicoes) {
      exportarExcel(
        expedicoes.map((p) => ({
          Cliente: p.clienteNome,
          Status: p.status,
          "Data prevista": new Date(p.dataPrevista).toLocaleDateString("pt-BR"),
          "Data expedição": p.dataExpedicao ? new Date(p.dataExpedicao).toLocaleDateString("pt-BR") : "—",
          "Qtd. itens": p.quantidadeItens,
        })),
        "pedidos-expedicao",
        "Pedidos de Expedição",
      );
    }
  }

  const resultados = tipoPedido === "recebimento" ? recebimentos : expedicoes;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface-raised p-4">
        <div className="w-44">
          <Select
            label="Tipo de pedido"
            value={tipoPedido}
            onChange={(e) => trocarTipoPedido(e.target.value as TipoPedido)}
          >
            <option value="recebimento">Recebimento</option>
            <option value="expedicao">Expedição</option>
          </Select>
        </div>
        <div className="w-56">
          <Select
            label={tipoPedido === "recebimento" ? "Fornecedor" : "Cliente"}
            value={parceiroId}
            onChange={(e) => setParceiroId(e.target.value)}
          >
            <option value="">Todos</option>
            {(tipoPedido === "recebimento" ? fornecedores : clientes).map((parceiro) => (
              <option key={parceiro.id} value={parceiro.id}>
                {parceiro.nome}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            {STATUS_PEDIDO.map((s) => (
              <option key={s.valor} value={s.valor}>
                {s.label}
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
        <div className="ml-auto">
          <BotaoExportar onClick={exportar} desabilitado={!resultados || resultados.length === 0} />
        </div>
      </div>

      {erro && <Alert>{erro}</Alert>}

      {!erro && resultados !== null && resultados.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-surface-raised p-10 text-center">
          <p className="text-sm font-medium text-ink">Nenhum pedido encontrado com esses filtros.</p>
        </div>
      )}

      {!erro && tipoPedido === "recebimento" && recebimentos && recebimentos.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-surface-raised">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Fornecedor</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Data prevista</th>
                <th className="px-4 py-3 font-medium">Data recebimento</th>
                <th className="px-4 py-3 font-medium">Qtd. itens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recebimentos.map((p) => (
                <tr key={p.id} className="hover:bg-surface">
                  <td className="px-4 py-3 text-ink">{p.fornecedorNome}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 font-data text-muted">
                    {new Date(p.dataPrevista).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 font-data text-muted">
                    {p.dataRecebimento ? new Date(p.dataRecebimento).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-4 py-3 font-data text-ink">{p.quantidadeItens}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!erro && tipoPedido === "expedicao" && expedicoes && expedicoes.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-surface-raised">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Data prevista</th>
                <th className="px-4 py-3 font-medium">Data expedição</th>
                <th className="px-4 py-3 font-medium">Qtd. itens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expedicoes.map((p) => (
                <tr key={p.id} className="hover:bg-surface">
                  <td className="px-4 py-3 text-ink">{p.clienteNome}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 font-data text-muted">
                    {new Date(p.dataPrevista).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 font-data text-muted">
                    {p.dataExpedicao ? new Date(p.dataExpedicao).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-4 py-3 font-data text-ink">{p.quantidadeItens}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
