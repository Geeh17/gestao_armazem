import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ProdutosListPage } from "@/pages/ProdutosListPage";
import { ProdutoFormPage } from "@/pages/ProdutoFormPage";
import { EstoquePage } from "@/pages/EstoquePage";
import { MovimentacoesPage } from "@/pages/MovimentacoesPage";
import { FornecedoresPage } from "@/pages/FornecedoresPage";
import { ClientesPage } from "@/pages/ClientesPage";
import { PedidosRecebimentoListPage } from "@/pages/PedidosRecebimentoListPage";
import { PedidoRecebimentoFormPage } from "@/pages/PedidoRecebimentoFormPage";
import { PedidoRecebimentoDetailPage } from "@/pages/PedidoRecebimentoDetailPage";
import { PedidosExpedicaoListPage } from "@/pages/PedidosExpedicaoListPage";
import { PedidoExpedicaoFormPage } from "@/pages/PedidoExpedicaoFormPage";
import { PedidoExpedicaoDetailPage } from "@/pages/PedidoExpedicaoDetailPage";
import { RelatoriosPage } from "@/pages/RelatoriosPage";
import { ArmazensPage } from "@/pages/ArmazensPage";
import { LocalizacoesPage } from "@/pages/LocalizacoesPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/produtos" element={<ProdutosListPage />} />
            <Route path="/produtos/novo" element={<ProdutoFormPage />} />
            <Route path="/estoque" element={<EstoquePage />} />
            <Route path="/movimentacoes" element={<MovimentacoesPage />} />
            <Route path="/fornecedores" element={<FornecedoresPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/pedidos-recebimento" element={<PedidosRecebimentoListPage />} />
            <Route path="/pedidos-recebimento/novo" element={<PedidoRecebimentoFormPage />} />
            <Route path="/pedidos-recebimento/:id" element={<PedidoRecebimentoDetailPage />} />
            <Route path="/pedidos-expedicao" element={<PedidosExpedicaoListPage />} />
            <Route path="/pedidos-expedicao/novo" element={<PedidoExpedicaoFormPage />} />
            <Route path="/pedidos-expedicao/:id" element={<PedidoExpedicaoDetailPage />} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
            <Route path="/armazens" element={<ArmazensPage />} />
            <Route path="/localizacoes" element={<LocalizacoesPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
