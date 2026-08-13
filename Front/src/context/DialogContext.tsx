import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ConfirmarOpcoes {
  titulo: string;
  mensagem: string;
  confirmarLabel?: string;
  cancelarLabel?: string;
  variantePerigo?: boolean;
}

interface PerguntarOpcoes {
  titulo: string;
  mensagem?: string;
  label: string;
  tipo?: "text" | "password";
  confirmarLabel?: string;
  cancelarLabel?: string;
}

interface DialogContextValue {
  /** Substitui window.confirm — retorna true se confirmado, false se cancelado. */
  confirmar: (opcoes: ConfirmarOpcoes) => Promise<boolean>;
  /** Substitui window.prompt — retorna o texto digitado, ou null se cancelado. */
  perguntar: (opcoes: PerguntarOpcoes) => Promise<string | null>;
}

type EstadoDialogo =
  | { tipo: "confirmar"; opcoes: ConfirmarOpcoes }
  | { tipo: "perguntar"; opcoes: PerguntarOpcoes }
  | null;

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoDialogo>(null);
  const [valorInput, setValorInput] = useState("");
  const resolverRef = useRef<((valor: boolean | string | null) => void) | null>(null);

  const confirmar = useCallback((opcoes: ConfirmarOpcoes) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = (valor) => resolve(Boolean(valor));
      setEstado({ tipo: "confirmar", opcoes });
    });
  }, []);

  const perguntar = useCallback((opcoes: PerguntarOpcoes) => {
    return new Promise<string | null>((resolve) => {
      resolverRef.current = (valor) => resolve(valor === false ? null : (valor as string | null));
      setValorInput("");
      setEstado({ tipo: "perguntar", opcoes });
    });
  }, []);

  function fechar(valor: boolean | string | null) {
    resolverRef.current?.(valor);
    resolverRef.current = null;
    setEstado(null);
  }

  const value = useMemo<DialogContextValue>(() => ({ confirmar, perguntar }), [confirmar, perguntar]);

  return (
    <DialogContext.Provider value={value}>
      {children}

      {estado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-titulo"
        >
          <div className="w-full max-w-sm rounded-lg border border-border bg-surface-raised p-6 shadow-xl">
            <h2 id="dialog-titulo" className="text-base font-semibold text-ink">
              {estado.opcoes.titulo}
            </h2>

            {estado.tipo === "confirmar" && (
              <>
                <p className="mt-2 text-sm text-muted">{estado.opcoes.mensagem}</p>
                <div className="mt-6 flex justify-end gap-3">
                  <Button type="button" variant="secondary" onClick={() => fechar(false)}>
                    {estado.opcoes.cancelarLabel ?? "Cancelar"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => fechar(true)}
                    className={estado.opcoes.variantePerigo ? "bg-danger hover:bg-danger" : undefined}
                  >
                    {estado.opcoes.confirmarLabel ?? "Confirmar"}
                  </Button>
                </div>
              </>
            )}

            {estado.tipo === "perguntar" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  fechar(valorInput);
                }}
              >
                {estado.opcoes.mensagem && <p className="mt-2 text-sm text-muted">{estado.opcoes.mensagem}</p>}
                <div className="mt-4">
                  <Input
                    label={estado.opcoes.label}
                    type={estado.opcoes.tipo ?? "text"}
                    value={valorInput}
                    onChange={(e) => setValorInput(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <Button type="button" variant="secondary" onClick={() => fechar(null)}>
                    {estado.opcoes.cancelarLabel ?? "Cancelar"}
                  </Button>
                  <Button type="submit">{estado.opcoes.confirmarLabel ?? "Confirmar"}</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog deve ser usado dentro de um DialogProvider.");
  }
  return context;
}
