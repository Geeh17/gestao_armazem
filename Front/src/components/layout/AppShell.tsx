import { Link, Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/context/AuthContext";

export function AppShell() {
  const { nome, role, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-end gap-4 border-b border-border bg-surface-raised px-6">
          {nome && (
            <span className="text-sm text-muted">
              {nome}
              {role && <span className="text-xs"> · {role}</span>}
            </span>
          )}
          <Link to="/trocar-senha" className="text-sm font-medium text-muted transition-colors hover:text-ink">
            Trocar senha
          </Link>
          <button
            onClick={logout}
            className="text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            Sair
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
