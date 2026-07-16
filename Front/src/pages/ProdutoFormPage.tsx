import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { criarProduto } from "@/api/produtos";
import { listarCategorias, type Categoria } from "@/api/categorias";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

export function ProdutoFormPage() {
  const navigate = useNavigate();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [sku, setSku] = useState("");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [unidadeMedida, setUnidadeMedida] = useState("UN");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState(0);

  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    listarCategorias()
      .then((dados) => {
        setCategorias(dados);
        if (dados.length > 0) setCategoriaId(dados[0].id);
      })
      .catch(() => setErro("Não foi possível carregar as categorias."));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSalvando(true);

    try {
      await criarProduto({
        sku,
        nome,
        descricao: descricao || null,
        categoriaId,
        unidadeMedida,
        codigoBarras: codigoBarras || null,
        estoqueMinimo,
      });
      navigate("/produtos", { replace: true });
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível salvar o produto.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Novo produto</h1>
        <p className="text-sm text-muted">Cadastre um produto para controlar seu estoque.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex max-w-xl flex-col gap-4 rounded-lg border border-border bg-surface-raised p-6"
      >
        <Input label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} required />
        <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <Input
          label="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="categoria" className="text-sm font-medium text-ink">
            Categoria
          </label>
          <select
            id="categoria"
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            required
            className="rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-ink focus:border-brand"
          >
            {categorias.length === 0 && <option value="">Nenhuma categoria disponível</option>}
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Unidade de medida"
            value={unidadeMedida}
            onChange={(e) => setUnidadeMedida(e.target.value)}
            required
          />
          <Input
            label="Estoque mínimo"
            type="number"
            min={0}
            value={estoqueMinimo}
            onChange={(e) => setEstoqueMinimo(Number(e.target.value))}
            required
          />
        </div>

        <Input
          label="Código de barras"
          value={codigoBarras}
          onChange={(e) => setCodigoBarras(e.target.value)}
        />

        {erro && <Alert>{erro}</Alert>}

        <div className="mt-2 flex gap-3">
          <Button type="submit" isLoading={salvando}>
            Salvar produto
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/produtos")}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
