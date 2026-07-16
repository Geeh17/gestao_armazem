interface JwtPayload {
  sub: string; // Id do usuário
  email?: string;
  name?: string;
  role?: string;
  exp?: number;
}

/** Decodifica o payload de um JWT (sem validar assinatura — só para leitura de claims no client). */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payloadBase64] = token.split(".");
    const normalized = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(normalized)
        .split("")
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}
