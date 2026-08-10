import { describe, expect, it } from "vitest";
import { formatarLocalizacao } from "./localizacao";
import type { Armazem } from "@/api/armazens";
import type { Localizacao } from "@/api/localizacoes";

const armazens: Armazem[] = [
  { id: "armazem-1", nome: "Armazém Central", endereco: null },
  { id: "armazem-2", nome: "Armazém Filial Sul", endereco: null },
];

const localizacoes: Localizacao[] = [
  { id: "loc-1", armazemId: "armazem-1", corredor: "A1", prateleira: "P1", nivel: "N1", codigo: "A1-P1-N1" },
  { id: "loc-2", armazemId: "armazem-2", corredor: "A1", prateleira: "P1", nivel: "N1", codigo: "A1-P1-N1" },
];

describe("formatarLocalizacao", () => {
  it("retorna travessão quando o id é nulo", () => {
    expect(formatarLocalizacao(null, localizacoes, armazens)).toBe("—");
  });

  it("formata como 'Armazém - Código'", () => {
    expect(formatarLocalizacao("loc-1", localizacoes, armazens)).toBe("Armazém Central - A1-P1-N1");
  });

  it("diferencia localizações com o mesmo código em armazéns diferentes", () => {
    // Motivo de existir a função: o código só é único dentro do próprio armazém.
    const resultado1 = formatarLocalizacao("loc-1", localizacoes, armazens);
    const resultado2 = formatarLocalizacao("loc-2", localizacoes, armazens);

    expect(resultado1).not.toBe(resultado2);
    expect(resultado1).toBe("Armazém Central - A1-P1-N1");
    expect(resultado2).toBe("Armazém Filial Sul - A1-P1-N1");
  });

  it("retorna o próprio id quando a localização não é encontrada", () => {
    expect(formatarLocalizacao("id-inexistente", localizacoes, armazens)).toBe("id-inexistente");
  });

  it("retorna só o código quando o armazém não é encontrado", () => {
    const localizacaoOrfa: Localizacao = {
      id: "loc-3",
      armazemId: "armazem-inexistente",
      corredor: "A1",
      prateleira: "P1",
      nivel: "N1",
      codigo: "A1-P1-N1",
    };

    expect(formatarLocalizacao("loc-3", [localizacaoOrfa], armazens)).toBe("A1-P1-N1");
  });
});
