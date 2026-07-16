import { apiFetch } from "./client";
import type { LoginRequest, TokenResponse } from "@/types/auth";

export function login(dto: LoginRequest): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: dto,
    auth: false,
  });
}
