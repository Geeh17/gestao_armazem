import { useEffect, useState, type FormEvent } from "react";
import {
  atualizarFornecedor,
  criarFornecedor,
  excluirFornecedor,
  listarFornecedores,
  type Fornecedor,
} from "@/api/fornecedores";
import { ApiError } from "@/api/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [contato, setContato] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  function carregar() {
    listarFornecedores()
      .then(setFornecedores)
      .catch(() => setErro("Não foi possível carregar os fornecedores."));
  }

  useEffect(carregar, []);

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setCnpj("");
    setContato("");
  }

  function iniciarEdicao(fornecedor: Fornecedor) {
    setEditandoId(fornecedor.id);
    setNome(fornecedor.nome);
    setCnpj(fornecedor.cnpj ?? "");
    setContato(fornecedor.contato ?? "");
    setErro(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSalvando(true);

    try {
      const dto = { nome, cnpj: cnpj || null, contato: contato || null };
      if (editandoId) {
        await atualizarFornecedor(editandoId, dto);
      } else {
        await criarFornecedor(dto);
      }
      limparFormulario();
      carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível salvar o fornecedor.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(fornecedor: Fornecedor) {
    if (!window.confirm(`Excluir o fornecedor "${fornecedor.nome}"?`)) return;

    setErro(null);
    setExcluindoId(fornecedor.id);
    try {
      await excluirFornecedor(fornecedor.id);
      if (editandoId === fornecedor.id) limparFormulario();
      carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível excluir o fornecedor.");
    } finally {
      setExcluindoId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Fornecedores</h1>
        <p className="text-sm text-muted">Fornecedores usados nos pedidos de recebimento.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-lg border border-border bg-surface-raised">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">CNPJ</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {fornecedores.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted">
                    Nenhum fornecedor cadastrado ainda.
                  </td>
                </tr>
              )}
              {fornecedores.map((fornecedor) => (
                <tr key={fornecedor.id} className="hover:bg-surface">
                  <td className="px-4 py-3 text-ink">{fornecedor.nome}</td>
                  <td className="px-4 py-3 font-data text-muted">{fornecedor.cnpj ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{fornecedor.contato ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(fornecedor)}
                        className="text-sm font-medium text-brand hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluir(fornecedor)}
                        disabled={excluindoId === fornecedor.id}
                        className="text-sm font-medium text-danger hover:underline disabled:opacity-50"
                      >
                        {excluindoId === fornecedor.id ? "Excluindo..." : "Excluir"}
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
            {editandoId ? "Editar fornecedor" : "Novo fornecedor"}
          </h2>
          <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          <Input label="CNPJ" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
          <Input label="Contato" value={contato} onChange={(e) => setContato(e.target.value)} />
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
