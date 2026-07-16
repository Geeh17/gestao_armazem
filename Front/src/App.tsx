import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { LoginPage } from "@/pages/LoginPage";
import { ProdutosListPage } from "@/pages/ProdutosListPage";
import { ProdutoFormPage } from "@/pages/ProdutoFormPage";
import { EstoquePage } from "@/pages/EstoquePage";
import { MovimentacoesPage } from "@/pages/MovimentacoesPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/produtos" element={<ProdutosListPage />} />
            <Route path="/produtos/novo" element={<ProdutoFormPage />} />
            <Route path="/estoque" element={<EstoquePage />} />
            <Route path="/movimentacoes" element={<MovimentacoesPage />} />
            <Route path="/" element={<Navigate to="/produtos" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/produtos" replace />} />
      </Routes>
    </AuthProvider>
  );
}
