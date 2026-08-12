const API_BASE_URL = import.meta.env.VITE_API_URL ?? "https://localhost:7100";

const TOKEN_STORAGE_KEY = "gestaoarmazem:token";
const REFRESH_TOKEN_STORAGE_KEY = "gestaoarmazem:refreshToken";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function setRefreshToken(refreshToken: string): void {
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
}

export function clearRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

/** Guarda o par de tokens de uma vez — usado após login e após renovação. */
export function setTokens(token: string, refreshToken: string): void {
  setToken(token);
  setRefreshToken(refreshToken);
}

export function clearTokens(): void {
  clearToken();
  clearRefreshToken();
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
}

// Compartilhada entre chamadas simultâneas: se várias requisições tomam 401 ao
// mesmo tempo (token expirou), só uma tentativa de renovação de verdade acontece —
// as outras esperam essa mesma promise em vez de disparar renovações paralelas.
let renovacaoEmAndamento: Promise<boolean> | null = null;

async function tentarRenovarToken(): Promise<boolean> {
  if (!renovacaoEmAndamento) {
    renovacaoEmAndamento = renovarTokenInterno().finally(() => {
      renovacaoEmAndamento = null;
    });
  }
  return renovacaoEmAndamento;
}

async function renovarTokenInterno(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return false;
    }

    const data = await response.json();
    setTokens(data.token, data.refreshToken);
    return true;
  } catch {
    // Falha de rede ao tentar renovar — mantém os tokens (podem só estar
    // offline momentaneamente); a próxima tentativa de uso tenta de novo.
    return false;
  }
}

/**
 * Wrapper de fetch: monta a URL a partir da API, injeta o Bearer token quando
 * `auth` (default true), e traduz o corpo de erro `{ erro: "..." }` que o
 * ExceptionHandlingMiddleware do backend sempre devolve em falhas.
 *
 * Em respostas 401 de uma chamada autenticada, tenta renovar o access token
 * via refresh token automaticamente e refaz a chamada original uma única vez
 * (o parâmetro interno `_tentativaDeNovo` evita loop se a renovação falhar).
 */
export async function apiFetch<TResponse>(
  path: string,
  { method = "GET", body, auth = true }: RequestOptions = {},
  _tentativaDeNovo = false,
): Promise<TResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && auth && !_tentativaDeNovo) {
    const renovou = await tentarRenovarToken();
    if (renovou) {
      return apiFetch<TResponse>(path, { method, body, auth }, true);
    }
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : undefined;

  if (!response.ok) {
    const mensagem = data?.erro ?? "Não foi possível completar a operação.";
    throw new ApiError(mensagem, response.status);
  }

  return data as TResponse;
}
