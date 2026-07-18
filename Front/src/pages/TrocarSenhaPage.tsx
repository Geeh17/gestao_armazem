import { useState, type FormEvent } from "react";
import { alterarSenha } from "@/api/auth";
import { ApiError } from "@/api/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function TrocarSenhaPage() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSucesso(null);

    if (novaSenha !== confirmarSenha) {
      setErro("A confirmação não bate com a nova senha.");
      return;
    }

    setSalvando(true);
    try {
      await alterarSenha({ senhaAtual, novaSenha });
      setSucesso("Senha alterada com sucesso.");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível alterar a senha.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Trocar senha</h1>
        <p className="text-sm text-muted">Altere a senha da sua conta.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex max-w-sm flex-col gap-4 rounded-lg border border-border bg-surface-raised p-6"
      >
        <Input
          label="Senha atual"
          type="password"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
          required
        />
        <Input
          label="Nova senha"
          type="password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          minLength={8}
          required
        />
        <Input
          label="Confirmar nova senha"
          type="password"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          minLength={8}
          required
        />

        {erro && <Alert>{erro}</Alert>}
        {sucesso && <Alert variant="success">{sucesso}</Alert>}

        <Button type="submit" isLoading={salvando} className="mt-2">
          Salvar nova senha
        </Button>
      </form>
    </div>
  );
}
