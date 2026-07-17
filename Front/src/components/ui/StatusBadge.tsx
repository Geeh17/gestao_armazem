type Status = "Pendente" | "EmAndamento" | "Concluido" | "Cancelado";

const STATUS_STYLES: Record<Status, string> = {
  Pendente: "bg-surface text-muted border border-border",
  EmAndamento: "bg-accent/15 text-accent-dark border border-accent/30",
  Concluido: "bg-success-surface text-success border border-success/20",
  Cancelado: "bg-danger-surface text-danger border border-danger/20",
};

const STATUS_LABELS: Record<Status, string> = {
  Pendente: "Pendente",
  EmAndamento: "Em andamento",
  Concluido: "Concluído",
  Cancelado: "Cancelado",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
