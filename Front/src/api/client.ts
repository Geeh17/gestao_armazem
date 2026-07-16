const API_BASE_URL = import.meta.env.VITE_API_URL ?? "https://localhost:7100";

const TOKEN_STORAGE_KEY = "gestaoarmazem:token";

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

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
}

/**
 * Wrapper de fetch: monta a URL a partir da API, injeta o Bearer token quando
 * `auth` (default true), e traduz o corpo de erro `{ erro: "..." }` que o
 * ExceptionHandlingMiddleware do backend sempre devolve em falhas.
 */
export async function apiFetch<TResponse>(
  path: string,
  { method = "GET", body, auth = true }: RequestOptions = {},
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
