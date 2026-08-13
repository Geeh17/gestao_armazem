import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { ToastProvider, useToast } from "./ToastContext";

function BotaoDeTeste({ variante }: { variante?: "success" | "error" | "info" }) {
  const { mostrarToast } = useToast();
  return (
    <button onClick={() => mostrarToast("Operação concluída.", variante)}>Disparar</button>
  );
}

describe("ToastContext", () => {
  it("mostra o toast ao chamar mostrarToast, e ele some sozinho depois de um tempo", () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <BotaoDeTeste />
      </ToastProvider>,
    );

    act(() => {
      screen.getByRole("button", { name: "Disparar" }).click();
    });

    expect(screen.getByText("Operação concluída.")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByText("Operação concluída.")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("mostra múltiplos toasts simultaneamente", () => {
    render(
      <ToastProvider>
        <BotaoDeTeste />
      </ToastProvider>,
    );

    const botao = screen.getByRole("button", { name: "Disparar" });
    act(() => botao.click());
    act(() => botao.click());

    expect(screen.getAllByText("Operação concluída.")).toHaveLength(2);
  });

  it("useToast fora do ToastProvider lança erro explicativo", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<BotaoDeTeste />)).toThrow(
      "useToast deve ser usado dentro de um ToastProvider.",
    );

    consoleSpy.mockRestore();
  });
});
