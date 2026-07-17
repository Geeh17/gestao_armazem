import { useEffect, useState, type FormEvent } from "react";
import { criarFornecedor, listarFornecedores, type Fornecedor } from "@/api/fornecedores";
import { ApiError } from "@/api/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [contato, setContato] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function carregar() {
    listarFornecedores()
      .then(setFornecedores)
      .catch(() => setErro("Não foi possível carregar os fornecedores."));
  }

  useEffect(carregar, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSalvando(true);

    try {
      await criarFornecedor({ nome, cnpj: cnpj || null, contato: contato || null });
      setNome("");
      setCnpj("");
      setContato("");
      carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível salvar o fornecedor.");
    } finally {
      setSalvando(false);
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
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {fornecedores.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-sm text-muted">
                    Nenhum fornecedor cadastrado ainda.
                  </td>
                </tr>
              )}
              {fornecedores.map((fornecedor) => (
                <tr key={fornecedor.id} className="hover:bg-surface">
                  <td className="px-4 py-3 text-ink">{fornecedor.nome}</td>
                  <td className="px-4 py-3 font-data text-muted">{fornecedor.cnpj ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{fornecedor.contato ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex h-fit flex-col gap-4 rounded-lg border border-border bg-surface-raised p-6"
        >
          <h2 className="text-sm font-semibold text-ink">Novo fornecedor</h2>
          <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          <Input label="CNPJ" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
          <Input label="Contato" value={contato} onChange={(e) => setContato(e.target.value)} />
          {erro && <Alert>{erro}</Alert>}
          <Button type="submit" isLoading={salvando}>
            Cadastrar
          </Button>
        </form>
      </div>
    </div>
  );
}
