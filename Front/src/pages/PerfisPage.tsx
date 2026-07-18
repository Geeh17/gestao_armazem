import { useEffect, useState, type FormEvent } from "react";
import { criarPerfil, listarPerfis, type Perfil } from "@/api/perfis";
import { ApiError } from "@/api/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function PerfisPage() {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function carregar() {
    listarPerfis()
      .then(setPerfis)
      .catch(() => setErro("Não foi possível carregar os perfis."));
  }

  useEffect(carregar, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSalvando(true);

    try {
      await criarPerfil({ nome });
      setNome("");
      carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível salvar o perfil.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Perfis</h1>
        <p className="text-sm text-muted">
          Grupos de permissão atribuídos aos usuários (ex.: Administrador, Gestor de Estoque).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-lg border border-border bg-surface-raised">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {perfis.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-muted">
                    Nenhum perfil cadastrado ainda.
                  </td>
                </tr>
              )}
              {perfis.map((perfil) => (
                <tr key={perfil.id} className="hover:bg-surface">
                  <td className="px-4 py-3 text-ink">{perfil.nome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex h-fit flex-col gap-4 rounded-lg border border-border bg-surface-raised p-6"
        >
          <h2 className="text-sm font-semibold text-ink">Novo perfil</h2>
          <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          {erro && <Alert>{erro}</Alert>}
          <Button type="submit" isLoading={salvando}>
            Cadastrar
          </Button>
        </form>
      </div>
    </div>
  );
}
