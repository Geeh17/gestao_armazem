import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  to: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: "/", label: "Visão geral", icon: "🏠" },
  { to: "/produtos", label: "Produtos", icon: "📦" },
  { to: "/armazens", label: "Armazéns", icon: "🏢" },
  { to: "/localizacoes", label: "Localizações", icon: "📍" },
  { to: "/estoque", label: "Estoque", icon: "📊" },
  { to: "/movimentacoes", label: "Movimentações", icon: "🔄" },
  { to: "/fornecedores", label: "Fornecedores", icon: "🏭" },
  { to: "/pedidos-recebimento", label: "Pedidos de Recebimento", icon: "📥" },
  { to: "/clientes", label: "Clientes", icon: "🧾" },
  { to: "/pedidos-expedicao", label: "Pedidos de Expedição", icon: "📤" },
  { to: "/relatorios", label: "Relatórios", icon: "📈" },
  { to: "/usuarios", label: "Usuários", icon: "👤", adminOnly: true },
  { to: "/perfis", label: "Perfis", icon: "🔐", adminOnly: true },
];

export function Sidebar() {
  const { isAdmin } = useAuth();
  const itensVisiveis = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-brand text-white">
      <div className="flex items-center gap-2 px-5 py-6">
        <span className="flex h-8 w-8 items-center justify-center rounded bg-accent text-sm font-bold text-brand-dark">
          GA
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Gestão de Armazém</p>
          <p className="text-xs text-white/60">Painel operacional</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {itensVisiveis.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4 text-xs text-white/50">
        v0.6 · Usuários e permissões
      </div>
    </aside>
  );
}
