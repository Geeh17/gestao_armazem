import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch, clearToken, getToken, setToken } from "./client";

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
