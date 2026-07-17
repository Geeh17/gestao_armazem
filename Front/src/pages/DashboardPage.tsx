import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { listarProdutos } from "@/api/produtos";
import { listarPedidosRecebimento, type PedidoRecebimento } from "@/api/pedidosRecebimento";
import { listarPedidosExpedicao, type PedidoExpedicao } from "@/api/pedidosExpedicao";
import { Alert } from "@/components/ui/Alert";

interface Contadores {
  produtos: number;
  recebimentosPendentes: number;
  expedicoesPendentes: number;
}

function pedidoEmAberto(status: string): boolean {
  return status === "Pendente" || status === "EmAndamento";
}

export function DashboardPage() {
  const [contadores, setContadores] = useState<Contadores | null>(null);
  const [recebimentos, setRecebimentos] = useState<PedidoRecebimento[]>([]);
  const [expedicoes, setExpedicoes] = useState<PedidoExpedicao[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listarProdutos(), listarPedidosRecebimento(), listarPedidosExpedicao()])
      .then(([produtos, pedidosRecebimento, pedidosExpedicao]) => {
        setRecebimentos(pedidosRecebimento.filter((p) => pedidoEmAberto(p.status)));
        setExpedicoes(pedidosExpedicao.filter((p) => pedidoEmAberto(p.status)));
        setContadores({
          produtos: produtos.length,
          recebimentosPendentes: pedidosRecebimento.filter((p) => pedidoEmAberto(p.status)).length,
          expedicoesPendentes: pedidosExpedicao.filter((p) => pedidoEmAberto(p.status)).length,
        });
      })
      .catch(() => setErro("Não foi possível carregar o resumo do armazém."));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Visão geral</h1>
        <p className="text-sm text-muted">Resumo rápido da operação do armazém.</p>
      </div>

      {erro && <Alert>{erro}</Alert>}

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Produtos cadastrados"
          value={contadores?.produtos}
          to="/produtos"
          accent="brand"
        />
        <SummaryCard
          label="Recebimentos em aberto"
          value={contadores?.recebimentosPendentes}
          to="/pedidos-recebimento"
          accent="accent"
        />
        <SummaryCard
          label="Expedições em aberto"
          value={contadores?.expedicoesPendentes}
          to="/pedidos-expedicao"
          accent="accent"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PendentesList
          titulo="Recebimentos pendentes"
          vazio="Nenhum recebimento pendente no momento."
          verTodosHref="/pedidos-recebimento"
        >
          {recebimentos.slice(0, 5).map((pedido) => (
            <Link
              key={pedido.id}
              to={`/pedidos-recebimento/${pedido.id}`}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-surface"
            >
              <span className="font-data text-muted">
                {new Date(pedido.dataPrevista).toLocaleDateString("pt-BR")}
              </span>
              <span className="text-ink">{pedido.itens.length} item(ns)</span>
            </Link>
          ))}
        </PendentesList>

        <PendentesList
          titulo="Expedições pendentes"
          vazio="Nenhuma expedição pendente no momento."
          verTodosHref="/pedidos-expedicao"
        >
          {expedicoes.slice(0, 5).map((pedido) => (
            <Link
              key={pedido.id}
              to={`/pedidos-expedicao/${pedido.id}`}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-surface"
            >
              <span className="font-data text-muted">
                {new Date(pedido.dataPrevista).toLocaleDateString("pt-BR")}
              </span>
              <span className="text-ink">{pedido.itens.length} item(ns)</span>
            </Link>
          ))}
        </PendentesList>
      </div>

      <div className="flex flex-wrap gap-3">
        <QuickLink to="/produtos/novo" label="+ Novo produto" />
        <QuickLink to="/movimentacoes" label="+ Registrar movimentação" />
        <QuickLink to="/pedidos-recebimento/novo" label="+ Novo pedido de recebimento" />
        <QuickLink to="/pedidos-expedicao/novo" label="+ Novo pedido de expedição" />
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  to,
  accent,
}: {
  label: string;
  value: number | undefined;
  to: string;
  accent: "brand" | "accent";
}) {
  const accentClass = accent === "brand" ? "text-brand" : "text-accent-dark";

  return (
    <Link
      to={to}
      className="rounded-lg border border-border bg-surface-raised p-5 transition-colors hover:border-brand"
    >
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 font-data text-3xl font-semibold ${accentClass}`}>
        {value === undefined ? "—" : value}
      </p>
    </Link>
  );
}

function PendentesList({
  titulo,
  vazio,
  verTodosHref,
  children,
}: {
  titulo: string;
  vazio: string;
  verTodosHref: string;
  children: ReactNode;
}) {
  const temItens = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <div className="rounded-lg border border-border bg-surface-raised p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">{titulo}</h2>
        <Link to={verTodosHref} className="text-sm font-medium text-brand hover:underline">
          Ver todos
        </Link>
      </div>
      {temItens ? (
        <div className="flex flex-col divide-y divide-border">{children}</div>
      ) : (
        <p className="py-4 text-sm text-muted">{vazio}</p>
      )}
    </div>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="rounded-md border border-border bg-surface-raised px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-brand hover:text-brand"
    >
      {label}
    </Link>
  );
}
