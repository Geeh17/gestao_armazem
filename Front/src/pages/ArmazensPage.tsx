import { useEffect, useState, type FormEvent } from "react";
import { criarArmazem, listarArmazens, type Armazem } from "@/api/armazens";
import { ApiError } from "@/api/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function ArmazensPage() {
  const [armazens, setArmazens] = useState<Armazem[]>([]);
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function carregar() {
    listarArmazens()
      .then(setArmazens)
      .catch(() => setErro("Não foi possível carregar os armazéns."));
  }

  useEffect(carregar, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSalvando(true);

    try {
      await criarArmazem({ nome, endereco: endereco || null });
      setNome("");
      setEndereco("");
      carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível salvar o armazém.");
    } finally {
      setSalvando(false);
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
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {armazens.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-sm text-muted">
                    Nenhum armazém cadastrado ainda.
                  </td>
                </tr>
              )}
              {armazens.map((armazem) => (
                <tr key={armazem.id} className="hover:bg-surface">
                  <td className="px-4 py-3 text-ink">{armazem.nome}</td>
                  <td className="px-4 py-3 text-muted">{armazem.endereco ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex h-fit flex-col gap-4 rounded-lg border border-border bg-surface-raised p-6"
        >
          <h2 className="text-sm font-semibold text-ink">Novo armazém</h2>
          <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          <Input label="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
          {erro && <Alert>{erro}</Alert>}
          <Button type="submit" isLoading={salvando}>
            Cadastrar
          </Button>
        </form>
      </div>
    </div>
  );
}
