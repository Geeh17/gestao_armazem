# Gestão de Armazém — Frontend

Interface web do sistema de Gestão de Armazém. React + TypeScript + Tailwind CSS (v4), Vite.

## Stack

- React 19 + TypeScript
- Vite 8 (build/dev server)
- Tailwind CSS v4 (via `@tailwindcss/vite`, sem arquivo de config separado — os tokens de
  design ficam em `src/index.css`, no bloco `@theme`)
- React Router v7

## Como rodar

1. Instale as dependências:
   ```
   npm install
   ```
2. Copie `.env.example` para `.env` e ajuste a URL da API se necessário:
   ```
   cp .env.example .env
   ```
   `VITE_API_URL` deve apontar para a porta HTTPS do `GestaoArmazem.API` (veja
   `Properties/launchSettings.json` no backend — por padrão `https://localhost:7100`).
3. Suba o backend (`GestaoArmazem.API`) separadamente — o front não funciona sozinho,
   precisa da API rodando.
4. Rode o front:
   ```
   npm run dev
   ```
5. Acesse `http://localhost:5173`. Faça login com o usuário admin do seed do backend:
   - Email: `admin@gestaoarmazem.local`
   - Senha: `Admin@123`

## Estrutura

```
src/
├── api/            # Client HTTP + chamadas por recurso (auth, produtos, categorias)
├── components/
│   ├── layout/     # Sidebar, AppShell (sidebar + topbar), ProtectedRoute
│   └── ui/         # Button, Input, Alert — componentes de UI genéricos
├── context/        # AuthContext (token em localStorage, login/logout)
├── pages/          # Uma página por rota
├── types/          # Tipos espelhando os DTOs do backend
├── App.tsx         # Definição das rotas
└── index.css       # Tokens de design (Tailwind v4 @theme) + estilos base
```

## Design

Paleta e tipografia ficam centralizadas em `src/index.css` (bloco `@theme`):

- **Navy** (`--color-brand`) como cor primária — a mesma usada na documentação técnica
  do projeto, mantendo a identidade visual consistente entre os artefatos.
- **Âmbar** (`--color-accent`) como acento — referência à sinalização de armazém
  (empilhadeiras, faixas de piso), não uma cor genérica de SaaS.
- **IBM Plex Sans** para texto de interface, **IBM Plex Mono** para dados técnicos
  (SKU, código de barras, quantidades, Ids) — a classe utilitária `.font-data` aplica
  essa fonte onde o dado precisa de escaneabilidade tipo planilha/ERP.

## Autenticação

O token JWT retornado por `POST /api/auth/login` é guardado no `localStorage`
(`gestaoarmazem:token`) e enviado automaticamente como `Authorization: Bearer {token}`
em toda chamada autenticada (`src/api/client.ts`). Rotas fora de `/login` exigem login
(`ProtectedRoute`, que redireciona para `/login` se não houver token).

## Status

Fatia vertical implementada: **Login**, **Produtos**, **Estoque**, **Movimentações**,
**Fornecedores**, **Clientes**, **Pedidos de Recebimento** (criar + confirmar recebimento
por item) e **Pedidos de Expedição** (criar + expedir o pedido inteiro de uma vez, RN06).
Cobre todo o núcleo funcional do backend.
