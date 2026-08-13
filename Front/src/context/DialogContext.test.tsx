import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DialogProvider, useDialog } from "./DialogContext";

function BotaoConfirmar({ aoResolver }: { aoResolver: (valor: boolean) => void }) {
  const { confirmar } = useDialog();
  return (
    <button
      onClick={async () => {
        const resultado = await confirmar({ titulo: "Excluir item", mensagem: "Tem certeza?" });
        aoResolver(resultado);
      }}
    >
      Abrir confirmação
    </button>
  );
}

function BotaoPerguntar({ aoResolver }: { aoResolver: (valor: string | null) => void }) {
  const { perguntar } = useDialog();
  return (
    <button
      onClick={async () => {
        const resultado = await perguntar({ titulo: "Nova senha", label: "Senha" });
        aoResolver(resultado);
      }}
    >
      Abrir pergunta
    </button>
  );
}

describe("DialogContext", () => {
  it("confirmar(): resolve true quando o usuário clica em Confirmar", async () => {
    let resultado: boolean | undefined;
    const usuario = userEvent.setup();

    render(
      <DialogProvider>
        <BotaoConfirmar aoResolver={(v) => (resultado = v)} />
      </DialogProvider>,
    );

    await usuario.click(screen.getByRole("button", { name: "Abrir confirmação" }));
    const dialogo = await screen.findByRole("dialog");
    expect(within(dialogo).getByText("Tem certeza?")).toBeInTheDocument();

    await usuario.click(within(dialogo).getByRole("button", { name: "Confirmar" }));

    expect(resultado).toBe(true);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("confirmar(): resolve false quando o usuário clica em Cancelar", async () => {
    let resultado: boolean | undefined;
    const usuario = userEvent.setup();

    render(
      <DialogProvider>
        <BotaoConfirmar aoResolver={(v) => (resultado = v)} />
      </DialogProvider>,
    );

    await usuario.click(screen.getByRole("button", { name: "Abrir confirmação" }));
    const dialogo = await screen.findByRole("dialog");
    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar" }));

    expect(resultado).toBe(false);
  });

  it("usa os rótulos customizados de confirmar/cancelar quando informados", async () => {
    function BotaoComLabels() {
      const { confirmar } = useDialog();
      return (
        <button
          onClick={() =>
            confirmar({
              titulo: "Excluir",
              mensagem: "Confirma?",
              confirmarLabel: "Excluir mesmo assim",
              cancelarLabel: "Deixa pra lá",
            })
          }
        >
          Abrir
        </button>
      );
    }
    const usuario = userEvent.setup();

    render(
      <DialogProvider>
        <BotaoComLabels />
      </DialogProvider>,
    );

    await usuario.click(screen.getByRole("button", { name: "Abrir" }));
    const dialogo = await screen.findByRole("dialog");

    expect(within(dialogo).getByRole("button", { name: "Excluir mesmo assim" })).toBeInTheDocument();
    expect(within(dialogo).getByRole("button", { name: "Deixa pra lá" })).toBeInTheDocument();
  });

  it("perguntar(): resolve o texto digitado ao confirmar", async () => {
    let resultado: string | null | undefined;
    const usuario = userEvent.setup();

    render(
      <DialogProvider>
        <BotaoPerguntar aoResolver={(v) => (resultado = v)} />
      </DialogProvider>,
    );

    await usuario.click(screen.getByRole("button", { name: "Abrir pergunta" }));
    const dialogo = await screen.findByRole("dialog");

    await usuario.type(within(dialogo).getByLabelText("Senha"), "senha-nova-123");
    await usuario.click(within(dialogo).getByRole("button", { name: "Confirmar" }));

    expect(resultado).toBe("senha-nova-123");
  });

  it("perguntar(): resolve null quando o usuário cancela", async () => {
    let resultado: string | null | undefined;
    const usuario = userEvent.setup();

    render(
      <DialogProvider>
        <BotaoPerguntar aoResolver={(v) => (resultado = v)} />
      </DialogProvider>,
    );

    await usuario.click(screen.getByRole("button", { name: "Abrir pergunta" }));
    const dialogo = await screen.findByRole("dialog");
    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar" }));

    expect(resultado).toBeNull();
  });

  it("useDialog fora do DialogProvider lança erro explicativo", () => {
    function ComponenteSemProvider() {
      useDialog();
      return null;
    }

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<ComponenteSemProvider />)).toThrow(
      "useDialog deve ser usado dentro de um DialogProvider.",
    );

    consoleSpy.mockRestore();
  });
});
