/**
 * Monta um JWT fake (header.payload.signature) só com os claims que os testes
 * precisam — não assina de verdade, só serve para exercitar código que decodifica
 * o payload no client (decodeJwt, AuthContext).
 *
 * Codifica em UTF-8 antes de base64 (TextEncoder + String.fromCharCode) porque um
 * btoa(JSON.stringify(...)) puro corrompe acentos — foi um bug real do primeiro
 * teste de lib/jwt.test.ts.
 */
export function montarTokenFake(payload: Record<string, unknown>): string {
  const base64url = (obj: object) => {
    const bytesUtf8 = new TextEncoder().encode(JSON.stringify(obj));
    const binario = String.fromCharCode(...bytesUtf8);
    return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  return `${base64url({ alg: "HS256", typ: "JWT" })}.${base64url(payload)}.assinatura-fake`;
}
