import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { cancelarPedidoExpedicao, expedirPedido, obterPedidoExpedicao, type PedidoExpedicao } from "@/api/pedidosExpedicao";
import { listarClientes, type Cliente } from "@/api/clientes";
import { listarProdutos } from "@/api/produtos";
import { listarLocalizacoes, type Localizacao } from "@/api/localizacoes";
import { listarArmazens, type Armazem } from "@/api/armazens";
import { ApiError } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import type { Produto } from "@/types/produto";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function PedidoExpedicaoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { usuarioId } = useAuth();

  const [pedido, setPedido] = useState<PedidoExpedicao | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([]);
  const [armazens, setArmazens] = useState<Armazem[]>([]);
  const [localizacaoPorItem, setLocalizacaoPorItem] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [expedindo, setExpedindo] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  function carregarPedido() {
    if (!id) return;
    obterPedidoExpedicao(id).then(setPedido).catch(() => setErro("Pedido não encontrado."));
  }

  useEffect(() => {
    carregarPedido();
    Promise.all([listarClientes(), listarProdutos(), listarLocalizacoes(), listarArmazens()]).then(
      ([clientesData, produtosData, localizacoesData, armazensData]) => {
        setClientes(clientesData);
        setProdutos(produtosData);
        setLocalizacoes(localizacoesData);
        setArmazens(armazensData);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function nomeArmazemDaLocalizacao(localizacaoId: string): string {
    const localizacao = localizacoes.find((l) => l.id === localizacaoId);
    if (!localizacao) return "";
    return armazens.find((a) => a.id === localizacao.armazemId)?.nome ?? "";
  }

  function nomeCliente(clienteId: string): string {
    return clientes.find((c) => c.id === clienteId)?.nome ?? clienteId;
  }

  function produtoLabel(produtoId: string): string {
    const produto = produtos.find((p) => p.id === produtoId);
    return produto ? `${produto.nome} (${produto.sku})` : produtoId;
  }

  async function handleExpedir() {
    if (!pedido) return;
    if (!usuarioId) {
      setErro("Sessão inválida. Faça login novamente.");
      return;
    }

    const itensSemLocalizacao = pedido.itens.some(
      (item) => !(localizacaoPorItem[item.id] ?? localizacoes[0]?.id),
    );
    if (itensSemLocalizacao) {
      setErro("Selecione a localização de origem de todos os itens.");
      return;
    }

    setErro(null);
    setSucesso(null);
    setExpedindo(true);

    try {
      await expedirPedido(pedido.id, {
        itens: pedido.itens.map((item) => ({
          itemId: item.id,
          localizacaoId: localizacaoPorItem[item.id] ?? localizacoes[0].id,
        })),
        usuarioId,
      });
      setSucesso("Pedido expedido com sucesso.");
      carregarPedido();
    } catch (err) {
      setErro(
        err instanceof ApiError
          ? err.message
          : "Não foi possível expedir o pedido.",
      );
    } finally {
      setExpedindo(false);
    }
  }

  async function handleCancelar() {
    if (!pedido) return;
    if (!window.confirm("Cancelar este pedido de expedição? Essa ação não pode ser desfeita.")) return;

    setErro(null);
    setSucesso(null);
    setCancelando(true);
    try {
      await cancelarPedidoExpedicao(pedido.id);
      setSucesso("Pedido cancelado.");
      carregarPedido();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível cancelar o pedido.");
    } finally {
      setCancelando(false);
    }
  }

  if (erro && !pedido) {
    return <Alert>{erro}</Alert>;
  }

  if (!pedido) {
    return <p className="text-sm text-muted">Carregando pedido...</p>;
  }

  const pedidoEncerrado = pedido.status === "Concluido" || pedido.status === "Cancelado";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Pedido de expedição</h1>
          <p className="text-sm text-muted">{nomeCliente(pedido.clienteId)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={pedido.status} />
          {!pedidoEncerrado && (
            <Button type="button" variant="secondary" onClick={handleCancelar} isLoading={cancelando}>
              Cancelar pedido
            </Button>
          )}
        </div>
      </div>

      {erro && <Alert>{erro}</Alert>}
      {sucesso && <Alert variant="success">{sucesso}</Alert>}

      {!pedidoEncerrado && (
        <Alert variant="success">
          A expedição é tudo ou nada: se faltar saldo de qualquer item, nada é baixado do estoque
          e o pedido continua pendente.
        </Alert>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-surface-raised">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium">Solicitado</th>
              <th className="px-4 py-3 font-medium">Expedido</th>
              {!pedidoEncerrado && <th className="px-4 py-3 font-medium">Localização de origem</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pedido.itens.map((item) => (
              <tr key={item.id} className="hover:bg-surface">
                <td className="px-4 py-3 text-ink">{produtoLabel(item.produtoId)}</td>
                <td className="px-4 py-3 font-data text-muted">{item.quantidadeSolicitada}</td>
                <td className="px-4 py-3 font-data text-muted">{item.quantidadeExpedida}</td>
                {!pedidoEncerrado && (
                  <td className="px-4 py-3">
                    <div className="w-40">
                      <Select
                        label="Localização"
                        value={localizacaoPorItem[item.id] ?? localizacoes[0]?.id ?? ""}
                        onChange={(e) =>
                          setLocalizacaoPorItem((atual) => ({ ...atual, [item.id]: e.target.value }))
                        }
                      >
                        {localizacoes.map((localizacao) => (
                          <option key={localizacao.id} value={localizacao.id}>
                            {nomeArmazemDaLocalizacao(localizacao.id)} - {localizacao.codigo}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!pedidoEncerrado && (
        <div>
          <Button type="button" onClick={handleExpedir} isLoading={expedindo}>
            Expedir pedido
          </Button>
        </div>
      )}

      <Link to="/pedidos-expedicao" className="text-sm font-medium text-brand hover:underline">
        ← Voltar para pedidos de expedição
      </Link>
    </div>
  );
}
