import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { ToastProvider } from "@/context/ToastContext";
import { DialogProvider } from "@/context/DialogContext";

/**
 * Envolve o componente em ToastProvider + DialogProvider — necessário para
 * qualquer página que use useToast()/useDialog() (a maioria, já que essas
 * substituem window.confirm/alert/prompt). Combine com AuthProvider/MemoryRouter
 * manualmente quando a página também precisar deles.
 */
export function renderComProviders(ui: ReactElement) {
  return render(<ToastProvider><DialogProvider>{ui}</DialogProvider></ToastProvider>);
}
