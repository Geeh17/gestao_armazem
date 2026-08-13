import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: number;
  mensagem: string;
  variante: ToastVariant;
}

interface ToastContextValue {
  mostrarToast: (mensagem: string, variante?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DURACAO_MS = 4000;

const estilosPorVariante: Record<ToastVariant, string> = {
  success: "border-success/30 bg-success-surface text-success",
  error: "border-danger/30 bg-danger-surface text-danger",
  info: "border-border bg-surface-raised text-ink",
};

let proximoId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const mostrarToast = useCallback((mensagem: string, variante: ToastVariant = "success") => {
    const id = proximoId++;
    setToasts((atual) => [...atual, { id, mensagem, variante }]);

    setTimeout(() => {
      setToasts((atual) => atual.filter((toast) => toast.id !== id));
    }, DURACAO_MS);
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ mostrarToast }), [mostrarToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto rounded-md border px-4 py-3 text-sm shadow-lg ${estilosPorVariante[toast.variante]}`}
          >
            {toast.mensagem}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de um ToastProvider.");
  }
  return context;
}
