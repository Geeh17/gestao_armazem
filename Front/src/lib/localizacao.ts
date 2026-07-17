import type { Armazem } from "@/api/armazens";
import type { Localizacao } from "@/api/localizacoes";

/**
 * Formata "Armazém - Código". Necessário porque o código de uma localização só é
 * único dentro do próprio armazém (UNIQUE(ArmazemId, Codigo)) — dois armazéns
 * diferentes podem ter localizações com o mesmo código.
 */
export function formatarLocalizacao(
  localizacaoId: string | null,
  localizacoes: Localizacao[],
  armazens: Armazem[],
): string {
  if (!localizacaoId) return "—";

  const localizacao = localizacoes.find((l) => l.id === localizacaoId);
  if (!localizacao) return localizacaoId;

  const armazem = armazens.find((a) => a.id === localizacao.armazemId);
  return armazem ? `${armazem.nome} - ${localizacao.codigo}` : localizacao.codigo;
}
