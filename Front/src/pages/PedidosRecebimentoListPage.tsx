import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listarPedidosRecebimento, type PedidoRecebimento } from "@/api/pedidosRecebimento";
import { listarFornecedores, type Fornecedor } from "@/api/fornecedores";
import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function PedidosRecebimentoListPage() {
  const [pedidos, setPedidos] = useState<PedidoRecebimento[] | null>(null);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listarPedidosRecebimento(), listarFornecedores()])
      .then(([pedidosData, fornecedoresData]) => {
        setPedidos(pedidosData);
        setFornecedores(fornecedoresData);
      })
      .catch(() => setErro("Não foi possível carregar os pedidos de recebimento."));
  }, []);

  function nomeFornecedor(fornecedorId: string): string {
    return fornecedores.find((f) => f.id === fornecedorId)?.nome ?? fornecedorId;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Pedidos de Recebimento</h1>
          <p className="text-sm text-muted">Pedidos de compra junto a fornecedores.</p>
        </div>
        <Link
          to="/pedidos-recebimento/novo"
          className="inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          Novo pedido
        </Link>
      </div>

      {erro && <Alert>{erro}</Alert>}

      {!erro && pedidos === null && <p className="text-sm text-muted">Carregando pedidos...</p>}

      {pedidos !== null && pedidos.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-surface-raised p-10 text-center">
          <p className="text-sm font-medium text-ink">Nenhum pedido de recebimento ainda.</p>
          <p className="mt-1 text-sm text-muted">Crie um pedido para começar a receber mercadorias.</p>
        </div>
      )}

      {pedidos !== null && pedidos.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-surface-raised">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Fornecedor</th>
                <th className="px-4 py-3 font-medium">Data prevista</th>
                <th className="px-4 py-3 font-medium">Itens</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pedidos.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-surface">
                  <td className="px-4 py-3 text-ink">{nomeFornecedor(pedido.fornecedorId)}</td>
                  <td className="px-4 py-3 font-data text-muted">
                    {new Date(pedido.dataPrevista).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 font-data text-muted">{pedido.itens.length}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={pedido.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/pedidos-recebimento/${pedido.id}`} className="text-sm font-medium text-brand hover:underline">
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
