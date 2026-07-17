import { useEffect, useState, type FormEvent } from "react";
import { listarArmazens, type Armazem } from "@/api/armazens";
import { criarLocalizacao, listarLocalizacoes, type Localizacao } from "@/api/localizacoes";
import { ApiError } from "@/api/client";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function LocalizacoesPage() {
  const [armazens, setArmazens] = useState<Armazem[]>([]);
  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([]);
  const [filtroArmazemId, setFiltroArmazemId] = useState("");

  const [armazemId, setArmazemId] = useState("");
  const [corredor, setCorredor] = useState("");
  const [prateleira, setPrateleira] = useState("");
  const [nivel, setNivel] = useState("");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function carregar() {
    Promise.all([listarArmazens(), listarLocalizacoes()])
      .then(([armazensData, localizacoesData]) => {
        setArmazens(armazensData);
        setLocalizacoes(localizacoesData);
        setArmazemId((atual) => atual || armazensData[0]?.id || "");
      })
      .catch(() => setErro("Não foi possível carregar armazéns e localizações."));
  }

  useEffect(carregar, []);

  function nomeArmazem(id: string): string {
    return armazens.find((a) => a.id === id)?.nome ?? id;
  }

  const localizacoesFiltradas = filtroArmazemId
    ? localizacoes.filter((l) => l.armazemId === filtroArmazemId)
    : localizacoes;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSalvando(true);

    try {
      await criarLocalizacao({ armazemId, corredor, prateleira, nivel, codigo });
      setCorredor("");
      setPrateleira("");
      setNivel("");
      setCodigo("");
      carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível salvar a localização.");
    } finally {
      setSalvando(false);
    }
  }

  if (armazens.length === 0 && !erro) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Localizações</h1>
        </div>
        <div className="rounded-lg border border-dashed border-border bg-surface-raised p-10 text-center">
          <p className="text-sm font-medium text-ink">Nenhum armazém cadastrado ainda.</p>
          <p className="mt-1 text-sm text-muted">Cadastre um armazém primeiro, na aba Armazéns.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Localizações</h1>
        <p className="text-sm text-muted">Endereços físicos (corredor/prateleira/nível) dentro de cada armazém.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-3">
          <div className="w-64">
            <Select
              label="Filtrar por armazém"
              value={filtroArmazemId}
              onChange={(e) => setFiltroArmazemId(e.target.value)}
            >
              <option value="">Todos os armazéns</option>
              {armazens.map((armazem) => (
                <option key={armazem.id} value={armazem.id}>
                  {armazem.nome}
                </option>
              ))}
            </Select>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-surface-raised">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Armazém</th>
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Corredor</th>
                  <th className="px-4 py-3 font-medium">Prateleira</th>
                  <th className="px-4 py-3 font-medium">Nível</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {localizacoesFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted">
                      Nenhuma localização cadastrada ainda.
                    </td>
                  </tr>
                )}
                {localizacoesFiltradas.map((localizacao) => (
                  <tr key={localizacao.id} className="hover:bg-surface">
                    <td className="px-4 py-3 text-ink">{nomeArmazem(localizacao.armazemId)}</td>
                    <td className="px-4 py-3 font-data text-ink">{localizacao.codigo}</td>
                    <td className="px-4 py-3 font-data text-muted">{localizacao.corredor}</td>
                    <td className="px-4 py-3 font-data text-muted">{localizacao.prateleira}</td>
                    <td className="px-4 py-3 font-data text-muted">{localizacao.nivel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex h-fit flex-col gap-4 rounded-lg border border-border bg-surface-raised p-6"
        >
          <h2 className="text-sm font-semibold text-ink">Nova localização</h2>
          <Select label="Armazém" value={armazemId} onChange={(e) => setArmazemId(e.target.value)} required>
            {armazens.map((armazem) => (
              <option key={armazem.id} value={armazem.id}>
                {armazem.nome}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-3 gap-2">
            <Input label="Corredor" value={corredor} onChange={(e) => setCorredor(e.target.value)} required />
            <Input label="Prateleira" value={prateleira} onChange={(e) => setPrateleira(e.target.value)} required />
            <Input label="Nível" value={nivel} onChange={(e) => setNivel(e.target.value)} required />
          </div>
          <Input
            label="Código"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="ex.: A1-P1-N1"
            required
          />
          {erro && <Alert>{erro}</Alert>}
          <Button type="submit" isLoading={salvando}>
            Cadastrar
          </Button>
        </form>
      </div>
    </div>
  );
}
