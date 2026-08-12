import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  apiFetch,
  clearRefreshToken,
  clearToken,
  getRefreshToken,
  getToken,
  setToken,
  setTokens,
} from "./client";

function mockFetchResponse(init: {
  status: number;
  body?: unknown;
  contentType?: string | null;
}) {
  const { status, body, contentType = "application/json" } = init;
  return vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    headers: { get: () => contentType },
    json: async () => body,
  } as unknown as Response);
}

describe("token storage (localStorage)", () => {
  it("começa sem token", () => {
    expect(getToken()).toBeNull();
  });

  it("guarda e recupera o token", () => {
    setToken("meu-token-jwt");
    expect(getToken()).toBe("meu-token-jwt");
  });

  it("limpa o token", () => {
    setToken("meu-token-jwt");
    clearToken();
    expect(getToken()).toBeNull();
  });
});

describe("refresh token storage (localStorage)", () => {
  it("guarda e recupera o refresh token separadamente do access token", () => {
    setTokens("access-token", "refresh-token");
    expect(getToken()).toBe("access-token");
    expect(getRefreshToken()).toBe("refresh-token");
  });
});

describe("apiFetch — renovação automática em 401", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renova o token e refaz a chamada original quando a API responde 401", async () => {
    setTokens("token-expirado", "refresh-valido");

    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/api/auth/refresh")) {
        return {
          status: 200,
          ok: true,
          headers: { get: () => "application/json" },
          json: async () => ({ token: "token-novo", expiraEm: "2026-01-01", refreshToken: "refresh-novo" }),
        } as unknown as Response;
      }
      // Primeira chamada ao endpoint real usa o token antigo -> 401.
      // Depois da renovação, a segunda chamada usa o token novo -> 200.
      const usouTokenNovo = getToken() === "token-novo";
      return {
        status: usouTokenNovo ? 200 : 401,
        ok: usouTokenNovo,
        headers: { get: () => "application/json" },
        json: async () => (usouTokenNovo ? { ok: true } : { erro: "Token expirado." }),
      } as unknown as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await apiFetch("/api/produtos");

    expect(resultado).toEqual({ ok: true });
    expect(getToken()).toBe("token-novo");
    expect(getRefreshToken()).toBe("refresh-novo");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/refresh"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("sem refresh token salvo, não tenta renovar e propaga o 401 original", async () => {
    setToken("token-sem-refresh");
    clearRefreshToken();

    const fetchMock = vi.fn().mockResolvedValue({
      status: 401,
      ok: false,
      headers: { get: () => "application/json" },
      json: async () => ({ erro: "Não autenticado." }),
    } as unknown as Response);
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/api/produtos")).rejects.toMatchObject({ status: 401 });
    // Só a chamada original — nenhuma tentativa de bater em /api/auth/refresh.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("quando a renovação também falha, propaga o 401 original sem loop infinito", async () => {
    setTokens("token-expirado", "refresh-tambem-invalido");

    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/api/auth/refresh")) {
        return {
          status: 401,
          ok: false,
          headers: { get: () => "application/json" },
          json: async () => ({ erro: "Sessão expirada." }),
        } as unknown as Response;
      }
      return {
        status: 401,
        ok: false,
        headers: { get: () => "application/json" },
        json: async () => ({ erro: "Não autenticado." }),
      } as unknown as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/api/produtos")).rejects.toMatchObject({ status: 401 });
    // Uma chamada original + uma tentativa de refresh — sem retry indefinido.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("duas chamadas simultâneas com 401 compartilham a mesma renovação (só um POST /refresh)", async () => {
    setTokens("token-expirado", "refresh-valido");

    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/api/auth/refresh")) {
        // Renovação um pouco "lenta" de propósito, pra garantir que a segunda
        // chamada de apiFetch chegue no 401 antes da renovação terminar.
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {
          status: 200,
          ok: true,
          headers: { get: () => "application/json" },
          json: async () => ({ token: "token-novo", expiraEm: "2026-01-01", refreshToken: "refresh-novo" }),
        } as unknown as Response;
      }
      const usouTokenNovo = getToken() === "token-novo";
      return {
        status: usouTokenNovo ? 200 : 401,
        ok: usouTokenNovo,
        headers: { get: () => "application/json" },
        json: async () => ({ ok: usouTokenNovo }),
      } as unknown as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    await Promise.all([apiFetch("/api/produtos"), apiFetch("/api/categorias")]);

    const chamadasDeRefresh = fetchMock.mock.calls.filter(([url]) =>
      String(url).endsWith("/api/auth/refresh"),
    );
    expect(chamadasDeRefresh).toHaveLength(1);
  });
});

describe("apiFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("injeta o Bearer token quando auth=true (padrão) e há token salvo", async () => {
    setToken("token-abc");
    const fetchMock = mockFetchResponse({ status: 200, body: { ok: true } });
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/produtos");

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers["Authorization"]).toBe("Bearer token-abc");
  });

  it("não injeta Authorization quando auth=false", async () => {
    setToken("token-abc");
    const fetchMock = mockFetchResponse({ status: 200, body: {} });
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/auth/login", { method: "POST", auth: false, body: {} });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers["Authorization"]).toBeUndefined();
  });

  it("retorna undefined em respostas 204 sem tentar ler o corpo", async () => {
    const fetchMock = mockFetchResponse({ status: 204, contentType: null });
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await apiFetch("/api/movimentacoes/entrada", { method: "POST", body: {} });

    expect(resultado).toBeUndefined();
  });

  it("lança ApiError com a mensagem do corpo { erro } quando a resposta falha", async () => {
    const fetchMock = mockFetchResponse({
      status: 422,
      body: { erro: "Saldo insuficiente do produto na localização." },
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/api/movimentacoes/saida", { method: "POST", body: {} })).rejects.toMatchObject({
      message: "Saldo insuficiente do produto na localização.",
      status: 422,
    });
  });

  it("usa mensagem genérica quando a resposta de erro não tem corpo JSON", async () => {
    const fetchMock = mockFetchResponse({ status: 500, contentType: null });
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/api/produtos")).rejects.toMatchObject({
      message: "Não foi possível completar a operação.",
      status: 500,
    });
  });

  it("resolve com os dados desserializados em respostas OK", async () => {
    const produto = { id: "1", sku: "SKU-1", nome: "Produto Teste" };
    const fetchMock = mockFetchResponse({ status: 200, body: produto });
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await apiFetch("/api/produtos/1");

    expect(resultado).toEqual(produto);
  });
});

describe("ApiError", () => {
  it("guarda a mensagem e o status", () => {
    const erro = new ApiError("mensagem de erro", 404);
    expect(erro.message).toBe("mensagem de erro");
    expect(erro.status).toBe(404);
    expect(erro.name).toBe("ApiError");
    expect(erro).toBeInstanceOf(Error);
  });
});
