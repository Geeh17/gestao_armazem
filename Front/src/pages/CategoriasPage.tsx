import { useEffect, useState, type FormEvent } from "react";
import {
  atualizarCategoria,
  criarCategoria,
  excluirCategoria,
  listarCategorias,
  type Categoria,
} from "@/api/categorias";
import { ApiError } from "@/api/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  function carregar() {
    listarCategorias()
      .then(setCategorias)
      .catch(() => setErro("Não foi possível carregar as categorias."));
  }

  useEffect(carregar, []);

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
  }

  function iniciarEdicao(categoria: Categoria) {
    setEditandoId(categoria.id);
    setNome(categoria.nome);
    setErro(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSalvando(true);

    try {
      if (editandoId) {
        await atualizarCategoria(editandoId, { nome });
      } else {
        await criarCategoria({ nome });
      }
      limparFormulario();
      carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível salvar a categoria.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(categoria: Categoria) {
    if (!window.confirm(`Excluir a categoria "${categoria.nome}"?`)) return;

    setErro(null);
    setExcluindoId(categoria.id);
    try {
      await excluirCategoria(categoria.id);
      if (editandoId === categoria.id) limparFormulario();
      carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível excluir a categoria.");
    } finally {
      setExcluindoId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Categorias</h1>
        <p className="text-sm text-muted">Categorias usadas para classificar os produtos.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-lg border border-border bg-surface-raised">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categorias.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-sm text-muted">
                    Nenhuma categoria cadastrada ainda.
                  </td>
                </tr>
              )}
              {categorias.map((categoria) => (
                <tr key={categoria.id} className="hover:bg-surface">
                  <td className="px-4 py-3 text-ink">{categoria.nome}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(categoria)}
                        className="text-sm font-medium text-brand hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluir(categoria)}
                        disabled={excluindoId === categoria.id}
                        className="text-sm font-medium text-danger hover:underline disabled:opacity-50"
                      >
                        {excluindoId === categoria.id ? "Excluindo..." : "Excluir"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex h-fit flex-col gap-4 rounded-lg border border-border bg-surface-raised p-6"
        >
          <h2 className="text-sm font-semibold text-ink">
            {editandoId ? "Editar categoria" : "Nova categoria"}
          </h2>
          <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          {erro && <Alert>{erro}</Alert>}
          <div className="flex gap-3">
            <Button type="submit" isLoading={salvando}>
              {editandoId ? "Salvar alterações" : "Cadastrar"}
            </Button>
            {editandoId && (
              <Button type="button" variant="secondary" onClick={limparFormulario}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
