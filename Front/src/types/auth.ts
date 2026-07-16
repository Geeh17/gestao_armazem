export interface LoginRequest {
  email: string;
  senha: string;
}

export interface TokenResponse {
  token: string;
  expiraEm: string;
}
