import { useEffect, useState, type FormEvent } from "react";
import {
  atualizarUsuario,
  criarUsuario,
  excluirUsuario,
  listarUsuarios,
  resetarSenhaUsuario,
  type Usuario,
} from "@/api/usuarios";
import { listarPerfis, type Perfil } from "@/api/perfis";
import { ApiError } from "@/api/client";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [perfis, setPerfis] = useState<Perfil[]>([]);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfilId, setPerfilId] = useState("");

  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [resetandoId, setResetandoId] = useState<string | null>(null);

  function carregar() {
    Promise.all([listarUsuarios(), listarPerfis()])
      .then(([usuariosData, perfisData]) => {
        setUsuarios(usuariosData);
        setPerfis(perfisData);
        setPerfilId((atual) => atual || perfisData[0]?.id || "");
      })
      .catch(() => setErro("Não foi possível carregar usuários e perfis."));
  }

  useEffect(carregar, []);

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setEmail("");
    setSenha("");
  }

  function iniciarEdicao(usuario: Usuario) {
    setEditandoId(usuario.id);
    setNome(usuario.nome);
    setEmail(usuario.email);
    setPerfilId(usuario.perfilId);
    setErro(null);
    setSucesso(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSucesso(null);
    setSalvando(true);

    try {
      if (editandoId) {
        await atualizarUsuario(editandoId, { nome, email, perfilId });
        setSucesso("Usuário atualizado.");
      } else {
        await criarUsuario({ nome, email, senha, perfilId });
        setSucesso("Usuário cadastrado.");
      }
      limparFormulario();
      carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível salvar o usuário.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(usuario: Usuario) {
    if (!window.confirm(`Excluir o usuário "${usuario.nome}"?`)) return;

    setErro(null);
    setSucesso(null);
    setExcluindoId(usuario.id);
    try {
      await excluirUsuario(usuario.id);
      if (editandoId === usuario.id) limparFormulario();
      carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível excluir o usuário.");
    } finally {
      setExcluindoId(null);
    }
  }

  async function handleResetarSenha(usuario: Usuario) {
    const novaSenha = window.prompt(
      `Nova senha provisória para "${usuario.nome}" (mínimo 8 caracteres):`,
    );
    if (!novaSenha) return;

    setErro(null);
    setSucesso(null);
    setResetandoId(usuario.id);
    try {
      await resetarSenhaUsuario(usuario.id, novaSenha);
      setSucesso(`Senha de ${usuario.nome} redefinida. Informe a nova senha para essa pessoa.`);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível redefinir a senha.");
    } finally {
      setResetandoId(null);
    }
  }

  if (perfis.length === 0 && !erro) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-semibold text-ink">Usuários</h1>
        <div className="rounded-lg border border-dashed border-border bg-surface-raised p-10 text-center">
          <p className="text-sm font-medium text-ink">Nenhum perfil cadastrado ainda.</p>
          <p className="mt-1 text-sm text-muted">Cadastre um perfil primeiro, na aba Perfis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Usuários</h1>
        <p className="text-sm text-muted">Contas com acesso ao sistema, agrupadas por perfil.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-lg border border-border bg-surface-raised">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Perfil</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted">
                    Nenhum usuário cadastrado ainda.
                  </td>
                </tr>
              )}
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-surface">
                  <td className="px-4 py-3 text-ink">{usuario.nome}</td>
                  <td className="px-4 py-3 font-data text-muted">{usuario.email}</td>
                  <td className="px-4 py-3 text-ink">{usuario.perfilNome}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(usuario)}
                        className="text-sm font-medium text-brand hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResetarSenha(usuario)}
                        disabled={resetandoId === usuario.id}
                        className="text-sm font-medium text-brand hover:underline disabled:opacity-50"
                      >
                        {resetandoId === usuario.id ? "Redefinindo..." : "Redefinir senha"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluir(usuario)}
                        disabled={excluindoId === usuario.id}
                        className="text-sm font-medium text-danger hover:underline disabled:opacity-50"
                      >
                        {excluindoId === usuario.id ? "Excluindo..." : "Excluir"}
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
            {editandoId ? "Editar usuário" : "Novo usuário"}
          </h2>
          <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {!editandoId && (
            <Input
              label="Senha provisória"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              minLength={8}
              required
            />
          )}
          {editandoId && (
            <p className="-mt-2 text-xs text-muted">
              Para trocar a senha, use "Redefinir senha" na lista.
            </p>
          )}
          <Select label="Perfil" value={perfilId} onChange={(e) => setPerfilId(e.target.value)} required>
            {perfis.map((perfil) => (
              <option key={perfil.id} value={perfil.id}>
                {perfil.nome}
              </option>
            ))}
          </Select>
          {erro && <Alert>{erro}</Alert>}
          {sucesso && <Alert variant="success">{sucesso}</Alert>}
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
