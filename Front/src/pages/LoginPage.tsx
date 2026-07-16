import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      await login(email, senha);
      navigate("/produtos", { replace: true });
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível conectar à API.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand px-4">
      <div className="w-full max-w-sm rounded-lg bg-surface-raised p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded bg-accent text-sm font-bold text-brand-dark">
            GA
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ink">Gestão de Armazém</p>
            <p className="text-xs text-muted">Entre com sua conta</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />

          {erro && <Alert>{erro}</Alert>}

          <Button type="submit" isLoading={carregando} className="mt-2 w-full">
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
