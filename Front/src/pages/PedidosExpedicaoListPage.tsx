import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listarPedidosExpedicao, type PedidoExpedicao } from "@/api/pedidosExpedicao";
import { listarClientes, type Cliente } from "@/api/clientes";
import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function PedidosExpedicaoListPage() {
  const [pedidos, setPedidos] = useState<PedidoExpedicao[] | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listarPedidosExpedicao(), listarClientes()])
      .then(([pedidosData, clientesData]) => {
        setPedidos(pedidosData);
        setClientes(clientesData);
      })
      .catch(() => setErro("Não foi possível carregar os pedidos de expedição."));
  }, []);

  function nomeCliente(clienteId: string): string {
    return clientes.find((c) => c.id === clienteId)?.nome ?? clienteId;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Pedidos de Expedição</h1>
          <p className="text-sm text-muted">Pedidos de saída para clientes.</p>
        </div>
        <Link
          to="/pedidos-expedicao/novo"
          className="inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          Novo pedido
        </Link>
      </div>

      {erro && <Alert>{erro}</Alert>}

      {!erro && pedidos === null && <p className="text-sm text-muted">Carregando pedidos...</p>}

      {pedidos !== null && pedidos.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-surface-raised p-10 text-center">
          <p className="text-sm font-medium text-ink">Nenhum pedido de expedição ainda.</p>
          <p className="mt-1 text-sm text-muted">Crie um pedido para começar a expedir mercadorias.</p>
        </div>
      )}

      {pedidos !== null && pedidos.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-surface-raised">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Data prevista</th>
                <th className="px-4 py-3 font-medium">Itens</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pedidos.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-surface">
                  <td className="px-4 py-3 text-ink">{nomeCliente(pedido.clienteId)}</td>
                  <td className="px-4 py-3 font-data text-muted">
                    {new Date(pedido.dataPrevista).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 font-data text-muted">{pedido.itens.length}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={pedido.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/pedidos-expedicao/${pedido.id}`} className="text-sm font-medium text-brand hover:underline">
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
