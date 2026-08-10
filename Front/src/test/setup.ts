import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// Limpa o DOM entre testes (equivalente ao afterEach automático do Jest com
// testing-library/react quando não se usa o preset globalSetup dele).
afterEach(() => {
  cleanup();
});

// localStorage real do jsdom já existe, mas garantimos estado limpo entre testes
// (vários testes de auth/token dependem disso).
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
