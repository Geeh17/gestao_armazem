/**
 * Gera e baixa um arquivo .xlsx a partir de uma lista de objetos simples
 * (cada chave vira uma coluna, cada item vira uma linha). Usado pelos botões
 * "Exportar Excel" dos relatórios — exporta exatamente o que está na tela
 * (já filtrado), sem precisar de um endpoint dedicado no backend.
 *
 * Import dinâmico de propósito: a lib xlsx é pesada (~300KB minificada) e só é
 * usada quando alguém clica em "Exportar" — carregá-la no bundle principal
 * penalizaria o carregamento inicial de todo mundo, mesmo quem nunca exporta.
 */
export async function exportarExcel(
  linhas: Record<string, string | number>[],
  nomeArquivo: string,
  nomeAba = "Dados",
): Promise<void> {
  const XLSX = await import("xlsx");
  const planilha = XLSX.utils.json_to_sheet(linhas);
  const livro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(livro, planilha, nomeAba);
  XLSX.writeFile(livro, `${nomeArquivo}.xlsx`);
}
