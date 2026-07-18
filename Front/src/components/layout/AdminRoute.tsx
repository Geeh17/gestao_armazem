import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * Bloqueia acesso a quem não é Administrador (defesa em profundidade — o
 * backend já rejeita essas rotas com 403 via [Authorize(Roles = "Administrador")],
 * isso aqui só evita que a tela renderize e depois falhe feio nas chamadas de API).
 */
export function AdminRoute() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
