import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { criarPedidoRecebimento } from "@/api/pedidosRecebimento";
import { listarFornecedores, type Fornecedor } from "@/api/fornecedores";
import { listarProdutos } from "@/api/produtos";
import { ApiError } from "@/api/client";
import type { Produto } from "@/types/produto";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface LinhaItem {
  produtoId: string;
  quantidadeEsperada: number;
}

export function PedidoRecebimentoFormPage() {
  const navigate = useNavigate();

  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fornecedorId, setFornecedorId] = useState("");
  const [dataPrevista, setDataPrevista] = useState("");
  const [itens, setItens] = useState<LinhaItem[]>([{ produtoId: "", quantidadeEsperada: 1 }]);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    Promise.all([listarFornecedores(), listarProdutos()])
      .then(([fornecedoresData, produtosData]) => {
        setFornecedores(fornecedoresData);
        setProdutos(produtosData);
        if (fornecedoresData.length > 0) setFornecedorId(fornecedoresData[0].id);
        if (produtosData.length > 0) {
          setItens([{ produtoId: produtosData[0].id, quantidadeEsperada: 1 }]);
        }
      })
      .catch(() => setErro("Não foi possível carregar fornecedores e produtos."));
  }, []);

  function atualizarItem(index: number, campo: keyof LinhaItem, valor: string | number) {
    setItens((atual) => atual.map((item, i) => (i === index ? { ...item, [campo]: valor } : item)));
  }

  function adicionarItem() {
    setItens((atual) => [...atual, { produtoId: produtos[0]?.id ?? "", quantidadeEsperada: 1 }]);
  }

  function removerItem(index: number) {
    setItens((atual) => atual.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);

    if (itens.length === 0) {
      setErro("Adicione ao menos um item ao pedido.");
      return;
    }

    setSalvando(true);
    try {
      const pedido = await criarPedidoRecebimento({ fornecedorId, dataPrevista, itens });
      navigate(`/pedidos-recebimento/${pedido.id}`, { replace: true });
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível criar o pedido.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Novo pedido de recebimento</h1>
        <p className="text-sm text-muted">Informe o fornecedor e os produtos esperados.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex max-w-2xl flex-col gap-4 rounded-lg border border-border bg-surface-raised p-6"
      >
        <div className="grid grid-cols-2 gap-4">
          <Select label="Fornecedor" value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)} required>
            {fornecedores.length === 0 && <option value="">Nenhum fornecedor cadastrado</option>}
            {fornecedores.map((fornecedor) => (
              <option key={fornecedor.id} value={fornecedor.id}>
                {fornecedor.nome}
              </option>
            ))}
          </Select>
          <Input
            label="Data prevista"
            type="date"
            value={dataPrevista}
            onChange={(e) => setDataPrevista(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Itens</h2>
            <button
              type="button"
              onClick={adicionarItem}
              className="text-sm font-medium text-brand hover:underline"
            >
              + Adicionar item
            </button>
          </div>

          {itens.map((item, index) => (
            <div key={index} className="flex items-end gap-3 rounded-md border border-border p-3">
              <div className="flex-1">
                <Select
                  label="Produto"
                  value={item.produtoId}
                  onChange={(e) => atualizarItem(index, "produtoId", e.target.value)}
                  required
                >
                  {produtos.map((produto) => (
                    <option key={produto.id} value={produto.id}>
                      {produto.nome} ({produto.sku})
                    </option>
                  ))}
                </Select>
              </div>
              <div className="w-32">
                <Input
                  label="Qtd. esperada"
                  type="number"
                  min={1}
                  value={item.quantidadeEsperada}
                  onChange={(e) => atualizarItem(index, "quantidadeEsperada", Number(e.target.value))}
                  required
                />
              </div>
              {itens.length > 1 && (
                <Button type="button" variant="secondary" onClick={() => removerItem(index)}>
                  Remover
                </Button>
              )}
            </div>
          ))}
        </div>

        {erro && <Alert>{erro}</Alert>}

        <div className="mt-2 flex gap-3">
          <Button type="submit" isLoading={salvando}>
            Criar pedido
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/pedidos-recebimento")}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
