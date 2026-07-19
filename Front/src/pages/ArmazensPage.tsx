import { useEffect, useState, type FormEvent } from "react";
import {
  atualizarArmazem,
  criarArmazem,
  excluirArmazem,
  listarArmazens,
  type Armazem,
} from "@/api/armazens";
import { ApiError } from "@/api/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function ArmazensPage() {
  const [armazens, setArmazens] = useState<Armazem[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  function carregar() {
    listarArmazens()
      .then(setArmazens)
      .catch(() => setErro("Não foi possível carregar os armazéns."));
  }

  useEffect(carregar, []);

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setEndereco("");
  }

  function iniciarEdicao(armazem: Armazem) {
    setEditandoId(armazem.id);
    setNome(armazem.nome);
    setEndereco(armazem.endereco ?? "");
    setErro(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSalvando(true);

    try {
      const dto = { nome, endereco: endereco || null };
      if (editandoId) {
        await atualizarArmazem(editandoId, dto);
      } else {
        await criarArmazem(dto);
      }
      limparFormulario();
      carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível salvar o armazém.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(armazem: Armazem) {
    if (!window.confirm(`Excluir o armazém "${armazem.nome}"?`)) return;

    setErro(null);
    setExcluindoId(armazem.id);
    try {
      await excluirArmazem(armazem.id);
      if (editandoId === armazem.id) limparFormulario();
      carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível excluir o armazém.");
    } finally {
      setExcluindoId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Armazéns</h1>
        <p className="text-sm text-muted">
          Cada armazém agrupa suas próprias localizações. Cadastre aqui antes de criar
          localizações em <span className="font-medium text-ink">Localizações</span>.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-lg border border-border bg-surface-raised">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Endereço</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {armazens.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-sm text-muted">
                    Nenhum armazém cadastrado ainda.
                  </td>
                </tr>
              )}
              {armazens.map((armazem) => (
                <tr key={armazem.id} className="hover:bg-surface">
                  <td className="px-4 py-3 text-ink">{armazem.nome}</td>
                  <td className="px-4 py-3 text-muted">{armazem.endereco ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(armazem)}
                        className="text-sm font-medium text-brand hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluir(armazem)}
                        disabled={excluindoId === armazem.id}
                        className="text-sm font-medium text-danger hover:underline disabled:opacity-50"
                      >
                        {excluindoId === armazem.id ? "Excluindo..." : "Excluir"}
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
            {editandoId ? "Editar armazém" : "Novo armazém"}
          </h2>
          <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          <Input label="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
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
