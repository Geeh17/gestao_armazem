import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  confirmarRecebimentoItem,
  obterPedidoRecebimento,
  type PedidoRecebimento,
} from "@/api/pedidosRecebimento";
import { listarFornecedores, type Fornecedor } from "@/api/fornecedores";
import { listarProdutos } from "@/api/produtos";
import { listarLocalizacoes, type Localizacao } from "@/api/localizacoes";
import { listarArmazens, type Armazem } from "@/api/armazens";
import { ApiError } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import type { Produto } from "@/types/produto";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function PedidoRecebimentoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { usuarioId } = useAuth();

  const [pedido, setPedido] = useState<PedidoRecebimento | null>(null);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([]);
  const [armazens, setArmazens] = useState<Armazem[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const [quantidades, setQuantidades] = useState<Record<string, number>>({});
  const [localizacaoPorItem, setLocalizacaoPorItem] = useState<Record<string, string>>({});
  const [confirmandoItemId, setConfirmandoItemId] = useState<string | null>(null);

  function carregarPedido() {
    if (!id) return;
    obterPedidoRecebimento(id).then(setPedido).catch(() => setErro("Pedido não encontrado."));
  }

  useEffect(() => {
    carregarPedido();
    Promise.all([listarFornecedores(), listarProdutos(), listarLocalizacoes(), listarArmazens()]).then(
      ([fornecedoresData, produtosData, localizacoesData, armazensData]) => {
        setFornecedores(fornecedoresData);
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

  function nomeFornecedor(fornecedorId: string): string {
    return fornecedores.find((f) => f.id === fornecedorId)?.nome ?? fornecedorId;
  }

  function produtoLabel(produtoId: string): string {
    const produto = produtos.find((p) => p.id === produtoId);
    return produto ? `${produto.nome} (${produto.sku})` : produtoId;
  }

  async function handleConfirmar(itemId: string) {
    if (!usuarioId) {
      setErro("Sessão inválida. Faça login novamente.");
      return;
    }

    const quantidadeRecebida = quantidades[itemId];
    const localizacaoId = localizacaoPorItem[itemId] ?? localizacoes[0]?.id;

    if (!quantidadeRecebida || quantidadeRecebida <= 0) {
      setErro("Informe uma quantidade recebida maior que zero.");
      return;
    }
    if (!localizacaoId) {
      setErro("Selecione a localização de destino.");
      return;
    }

    setErro(null);
    setSucesso(null);
    setConfirmandoItemId(itemId);

    try {
      await confirmarRecebimentoItem(pedido!.id, itemId, {
        quantidadeRecebida,
        localizacaoId,
        usuarioId,
      });
      setSucesso("Recebimento confirmado e estoque atualizado.");
      setQuantidades((atual) => ({ ...atual, [itemId]: 0 }));
      carregarPedido();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível confirmar o recebimento.");
    } finally {
      setConfirmandoItemId(null);
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
          <h1 className="text-xl font-semibold text-ink">Pedido de recebimento</h1>
          <p className="text-sm text-muted">{nomeFornecedor(pedido.fornecedorId)}</p>
        </div>
        <StatusBadge status={pedido.status} />
      </div>

      {erro && <Alert>{erro}</Alert>}
      {sucesso && <Alert variant="success">{sucesso}</Alert>}

      <div className="overflow-hidden rounded-lg border border-border bg-surface-raised">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium">Esperado</th>
              <th className="px-4 py-3 font-medium">Recebido</th>
              {!pedidoEncerrado && <th className="px-4 py-3 font-medium">Confirmar recebimento</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pedido.itens.map((item) => {
              const completo = item.quantidadeRecebida >= item.quantidadeEsperada;
              return (
                <tr key={item.id} className="hover:bg-surface">
                  <td className="px-4 py-3 text-ink">{produtoLabel(item.produtoId)}</td>
                  <td className="px-4 py-3 font-data text-muted">{item.quantidadeEsperada}</td>
                  <td className="px-4 py-3 font-data text-muted">{item.quantidadeRecebida}</td>
                  {!pedidoEncerrado && (
                    <td className="px-4 py-3">
                      {completo ? (
                        <span className="text-sm text-success">Completo</span>
                      ) : (
                        <div className="flex items-end gap-2">
                          <div className="w-24">
                            <Input
                              label="Qtd."
                              type="number"
                              min={1}
                              value={quantidades[item.id] ?? ""}
                              onChange={(e) =>
                                setQuantidades((atual) => ({
                                  ...atual,
                                  [item.id]: Number(e.target.value),
                                }))
                              }
                            />
                          </div>
                          <div className="w-40">
                            <Select
                              label="Localização"
                              value={localizacaoPorItem[item.id] ?? localizacoes[0]?.id ?? ""}
                              onChange={(e) =>
                                setLocalizacaoPorItem((atual) => ({
                                  ...atual,
                                  [item.id]: e.target.value,
                                }))
                              }
                            >
                              {localizacoes.map((localizacao) => (
                                <option key={localizacao.id} value={localizacao.id}>
                                  {nomeArmazemDaLocalizacao(localizacao.id)} - {localizacao.codigo}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <Button
                            type="button"
                            onClick={() => handleConfirmar(item.id)}
                            isLoading={confirmandoItemId === item.id}
                          >
                            Confirmar
                          </Button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Link to="/pedidos-recebimento" className="text-sm font-medium text-brand hover:underline">
        ← Voltar para pedidos de recebimento
      </Link>
    </div>
  );
}
