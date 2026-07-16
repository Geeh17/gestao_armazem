import { useEffect, useState, type FormEvent } from "react";
import { listarProdutos } from "@/api/produtos";
import { listarLocalizacoes, type Localizacao } from "@/api/localizacoes";
import { registrarEntrada, registrarSaida, registrarTransferencia } from "@/api/movimentacoes";
import { ApiError } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import type { Produto } from "@/types/produto";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

type Tipo = "entrada" | "saida" | "transferencia";

const TABS: { tipo: Tipo; label: string }[] = [
  { tipo: "entrada", label: "Entrada" },
  { tipo: "saida", label: "Saída" },
  { tipo: "transferencia", label: "Transferência" },
];

export function MovimentacoesPage() {
  const { usuarioId } = useAuth();
  const [tipo, setTipo] = useState<Tipo>("entrada");

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([]);

  const [produtoId, setProdutoId] = useState("");
  const [localizacaoId, setLocalizacaoId] = useState("");
  const [localizacaoOrigemId, setLocalizacaoOrigemId] = useState("");
  const [localizacaoDestinoId, setLocalizacaoDestinoId] = useState("");
  const [quantidade, setQuantidade] = useState(1);

  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    Promise.all([listarProdutos(), listarLocalizacoes()])
      .then(([produtosData, localizacoesData]) => {
        setProdutos(produtosData);
        setLocalizacoes(localizacoesData);
        if (produtosData.length > 0) setProdutoId(produtosData[0].id);
        if (localizacoesData.length > 0) {
          setLocalizacaoId(localizacoesData[0].id);
          setLocalizacaoOrigemId(localizacoesData[0].id);
          setLocalizacaoDestinoId(localizacoesData[0].id);
        }
      })
      .catch(() => setErro("Não foi possível carregar produtos e localizações."));
  }, []);

  function trocarAba(novaAba: Tipo) {
    setTipo(novaAba);
    setErro(null);
    setSucesso(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSucesso(null);

    if (!usuarioId) {
      setErro("Sessão inválida. Faça login novamente.");
      return;
    }

    setSalvando(true);
    try {
      if (tipo === "entrada") {
        await registrarEntrada({ produtoId, localizacaoId, quantidade, usuarioId });
        setSucesso("Entrada registrada e saldo atualizado.");
      } else if (tipo === "saida") {
        await registrarSaida({ produtoId, localizacaoId, quantidade, usuarioId });
        setSucesso("Saída registrada e saldo atualizado.");
      } else {
        await registrarTransferencia({
          produtoId,
          localizacaoOrigemId,
          localizacaoDestinoId,
          quantidade,
          usuarioId,
        });
        setSucesso("Transferência registrada.");
      }
      setQuantidade(1);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível registrar a movimentação.");
    } finally {
      setSalvando(false);
    }
  }

  const produtoSelect = (
    <Select label="Produto" value={produtoId} onChange={(e) => setProdutoId(e.target.value)} required>
      {produtos.length === 0 && <option value="">Nenhum produto cadastrado</option>}
      {produtos.map((produto) => (
        <option key={produto.id} value={produto.id}>
          {produto.nome} ({produto.sku})
        </option>
      ))}
    </Select>
  );

  function localizacaoOptions() {
    if (localizacoes.length === 0) {
      return <option value="">Nenhuma localização cadastrada</option>;
    }
    return localizacoes.map((localizacao) => (
      <option key={localizacao.id} value={localizacao.id}>
        {localizacao.codigo}
      </option>
    ));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Movimentações</h1>
        <p className="text-sm text-muted">Registre entradas, saídas e transferências de estoque.</p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.tipo}
            type="button"
            onClick={() => trocarAba(tab.tipo)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tipo === tab.tipo
                ? "border-b-2 border-brand text-brand"
                : "text-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex max-w-md flex-col gap-4 rounded-lg border border-border bg-surface-raised p-6"
      >
        {produtoSelect}

        {tipo === "entrada" && (
          <Select label="Localização de destino" value={localizacaoId} onChange={(e) => setLocalizacaoId(e.target.value)} required>
            {localizacaoOptions()}
          </Select>
        )}

        {tipo === "saida" && (
          <Select label="Localização de origem" value={localizacaoId} onChange={(e) => setLocalizacaoId(e.target.value)} required>
            {localizacaoOptions()}
          </Select>
        )}

        {tipo === "transferencia" && (
          <>
            <Select
              label="Localização de origem"
              value={localizacaoOrigemId}
              onChange={(e) => setLocalizacaoOrigemId(e.target.value)}
              required
            >
              {localizacaoOptions()}
            </Select>
            <Select
              label="Localização de destino"
              value={localizacaoDestinoId}
              onChange={(e) => setLocalizacaoDestinoId(e.target.value)}
              required
            >
              {localizacaoOptions()}
            </Select>
          </>
        )}

        <Input
          label="Quantidade"
          type="number"
          min={1}
          value={quantidade}
          onChange={(e) => setQuantidade(Number(e.target.value))}
          required
        />

        {erro && <Alert>{erro}</Alert>}
        {sucesso && <Alert variant="success">{sucesso}</Alert>}

        <Button type="submit" isLoading={salvando} className="mt-2">
          Registrar {TABS.find((t) => t.tipo === tipo)?.label.toLowerCase()}
        </Button>
      </form>
    </div>
  );
}
