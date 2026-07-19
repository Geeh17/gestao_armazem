import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { atualizarProduto, criarProduto, obterProduto } from "@/api/produtos";
import { listarCategorias, type Categoria } from "@/api/categorias";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";

export function ProdutoFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const modoEdicao = Boolean(id);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [sku, setSku] = useState("");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [unidadeMedida, setUnidadeMedida] = useState("UN");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState(0);

  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(modoEdicao);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    listarCategorias()
      .then((dados) => {
        setCategorias(dados);
        if (dados.length > 0 && !modoEdicao) setCategoriaId(dados[0].id);
      })
      .catch(() => setErro("Não foi possível carregar as categorias."));
  }, [modoEdicao]);

  useEffect(() => {
    if (!id) return;
    obterProduto(id)
      .then((produto) => {
        setSku(produto.sku);
        setNome(produto.nome);
        setDescricao(produto.descricao ?? "");
        setCategoriaId(produto.categoriaId);
        setUnidadeMedida(produto.unidadeMedida);
        setCodigoBarras(produto.codigoBarras ?? "");
        setEstoqueMinimo(produto.estoqueMinimo);
      })
      .catch(() => setErro("Não foi possível carregar o produto."))
      .finally(() => setCarregando(false));
  }, [id]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSalvando(true);

    try {
      if (modoEdicao && id) {
        await atualizarProduto(id, {
          nome,
          descricao: descricao || null,
          categoriaId,
          unidadeMedida,
          codigoBarras: codigoBarras || null,
          estoqueMinimo,
        });
      } else {
        await criarProduto({
          sku,
          nome,
          descricao: descricao || null,
          categoriaId,
          unidadeMedida,
          codigoBarras: codigoBarras || null,
          estoqueMinimo,
        });
      }
      navigate("/produtos", { replace: true });
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível salvar o produto.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <p className="text-sm text-muted">Carregando produto...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">
          {modoEdicao ? "Editar produto" : "Novo produto"}
        </h1>
        <p className="text-sm text-muted">
          {modoEdicao
            ? "O SKU não pode ser alterado depois de cadastrado."
            : "Cadastre um produto para controlar seu estoque."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex max-w-xl flex-col gap-4 rounded-lg border border-border bg-surface-raised p-6"
      >
        <Input
          label="SKU"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          required
          disabled={modoEdicao}
        />
        <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <Input
          label="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <Select label="Categoria" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required>
          {categorias.length === 0 && <option value="">Nenhuma categoria disponível</option>}
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </Select>

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
            {modoEdicao ? "Salvar alterações" : "Salvar produto"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/produtos")}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
