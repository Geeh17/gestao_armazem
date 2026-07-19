import { useEffect, useState, type FormEvent } from "react";
import {
  atualizarCliente,
  criarCliente,
  excluirCliente,
  listarClientes,
  type Cliente,
} from "@/api/clientes";
import { ApiError } from "@/api/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [documento, setDocumento] = useState("");
  const [contato, setContato] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  function carregar() {
    listarClientes()
      .then(setClientes)
      .catch(() => setErro("Não foi possível carregar os clientes."));
  }

  useEffect(carregar, []);

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setDocumento("");
    setContato("");
  }

  function iniciarEdicao(cliente: Cliente) {
    setEditandoId(cliente.id);
    setNome(cliente.nome);
    setDocumento(cliente.documento ?? "");
    setContato(cliente.contato ?? "");
    setErro(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSalvando(true);

    try {
      const dto = { nome, documento: documento || null, contato: contato || null };
      if (editandoId) {
        await atualizarCliente(editandoId, dto);
      } else {
        await criarCliente(dto);
      }
      limparFormulario();
      carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível salvar o cliente.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(cliente: Cliente) {
    if (!window.confirm(`Excluir o cliente "${cliente.nome}"?`)) return;

    setErro(null);
    setExcluindoId(cliente.id);
    try {
      await excluirCliente(cliente.id);
      if (editandoId === cliente.id) limparFormulario();
      carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível excluir o cliente.");
    } finally {
      setExcluindoId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Clientes</h1>
        <p className="text-sm text-muted">Clientes usados nos pedidos de expedição.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-lg border border-border bg-surface-raised">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Documento</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clientes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted">
                    Nenhum cliente cadastrado ainda.
                  </td>
                </tr>
              )}
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-surface">
                  <td className="px-4 py-3 text-ink">{cliente.nome}</td>
                  <td className="px-4 py-3 font-data text-muted">{cliente.documento ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{cliente.contato ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(cliente)}
                        className="text-sm font-medium text-brand hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluir(cliente)}
                        disabled={excluindoId === cliente.id}
                        className="text-sm font-medium text-danger hover:underline disabled:opacity-50"
                      >
                        {excluindoId === cliente.id ? "Excluindo..." : "Excluir"}
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
            {editandoId ? "Editar cliente" : "Novo cliente"}
          </h2>
          <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          <Input label="Documento" value={documento} onChange={(e) => setDocumento(e.target.value)} />
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
