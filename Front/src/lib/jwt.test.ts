import { describe, expect, it } from "vitest";
import { decodeJwt } from "./jwt";
import { montarTokenFake as montarToken } from "@/test/token";

describe("decodeJwt", () => {
  it("decodifica um token válido e retorna os claims", () => {
    const token = montarToken({
      sub: "usuario-123",
      email: "admin@gestaoarmazem.local",
      name: "Administrador",
      role: "Administrador",
    });

    const payload = decodeJwt(token);

    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe("usuario-123");
    expect(payload?.email).toBe("admin@gestaoarmazem.local");
    expect(payload?.role).toBe("Administrador");
  });

  it("decodifica corretamente caracteres acentuados no payload", () => {
    const token = montarToken({ sub: "abc", name: "José Não-ASCII Ção" });

    const payload = decodeJwt(token);

    expect(payload?.name).toBe("José Não-ASCII Ção");
  });

  it("retorna null para um token malformado", () => {
    expect(decodeJwt("nao-e-um-jwt")).toBeNull();
    expect(decodeJwt("")).toBeNull();
    expect(decodeJwt("a.b")).toBeNull();
  });

  it("retorna null quando o payload não é um JSON válido", () => {
    const tokenComPayloadInvalido = "header.bm90LWpzb24.assinatura";
    expect(decodeJwt(tokenComPayloadInvalido)).toBeNull();
  });
});
