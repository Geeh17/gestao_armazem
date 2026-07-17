# Gestão de Armazém

Sistema de gestão de armazém (WMS) — controle de estoque, localizações, movimentações e
pedidos de recebimento/expedição. Full-stack: API em .NET, front-end em React.

## Stack

| Camada          | Tecnologia                                    |
|-----------------|------------------------------------------------|
| Back-end        | .NET 8 (Web API)                               |
| Acesso a dados  | Dapper                                          |
| Banco de dados  | SQL Server                                      |
| Migrações       | DbUp (`GestaoArmazem.Database`)                 |
| Autenticação    | JWT (bcrypt para hash de senha)                 |
| Front-end       | React 19 + TypeScript, Vite 8                   |
| Estilização     | Tailwind CSS v4                                 |

## Estrutura do repositório

```
├── GestaoArmazem/                          # Back-end (.NET)
│   ├── src/
│   │   ├── GestaoArmazem.Domain             # Entidades, enums, interfaces de repositório
│   │   ├── GestaoArmazem.Application        # DTOs, validators, serviços (casos de uso)
│   │   ├── GestaoArmazem.Infrastructure     # Repositórios Dapper, conexão com o banco
│   │   ├── GestaoArmazem.API                # Controllers, Program.cs, configuração
│   │   ├── GestaoArmazem.Database           # Runner DbUp: aplica os scripts SQL
│   │   └── database/scripts                 # Scripts SQL versionados (fonte única de verdade)
│   └── tests/
│       └── GestaoArmazem.Application.Tests
│
├── frontend/                                # Front-end (React + TypeScript + Tailwind)
│   └── src/
│       ├── api/            # Client HTTP + chamadas por recurso (auth, produtos, ...)
│       ├── components/
│       │   ├── layout/     # Sidebar, AppShell, ProtectedRoute
│       │   └── ui/         # Button, Input, Select, Alert, StatusBadge
│       ├── context/        # AuthContext (token em localStorage, login/logout)
│       ├── lib/            # Utilitários (ex.: decodificação de JWT)
│       ├── pages/          # Uma página por rota
│       ├── types/          # Tipos espelhando os DTOs do backend
│       └── App.tsx         # Definição das rotas
│
└── Documentacao/                            # Documentação técnica completa (Word)
```

## IDEs recomendadas

- **Back-end**: Visual Studio 2026 (abra `GestaoArmazem/GestaoArmazem.sln`)
- **Front-end**: VS Code
- **Banco de dados**: SQL Server Management Studio ou Azure Data Studio

## Como rodar

### 1. Banco de dados + Back-end

1. Suba um SQL Server local (ou use uma instância existente).
2. Ajuste a connection string em `GestaoArmazem/src/GestaoArmazem.API/appsettings.Development.json`
   se necessário (atenção especial ao nome da instância — instalações Express costumam usar
   `.\SQLEXPRESS`, não `localhost` sozinho).
3. Abra `GestaoArmazem/GestaoArmazem.sln` no Visual Studio 2026 e rode o projeto `GestaoArmazem.API`
   (ou `dotnet run --project GestaoArmazem/src/GestaoArmazem.API`).
   O banco `GestaoArmazem_Dev` é criado e os scripts SQL são aplicados **automaticamente**
   nesse momento via DbUp — não precisa rodar nada manualmente.
4. A API sobe com Swagger em `/swagger` — confirme que responde antes de seguir pro front.

### 2. Front-end

1. Em outro terminal:
   ```
   cd frontend
   npm install
   cp .env.example .env
   ```
2. Ajuste `VITE_API_URL` no `.env` para a porta HTTPS da API (por padrão `https://localhost:7100`,
   veja `GestaoArmazem/src/GestaoArmazem.API/Properties/launchSettings.json`).
3. Rode o front:
   ```
   npm run dev
   ```
4. Acesse `http://localhost:5173`. Faça login com o usuário admin do seed do backend:
   - Email: `admin@gestaoarmazem.local`
   - Senha: `Admin@123`

### Rodando os testes do back-end

```
dotnet test GestaoArmazem/tests/GestaoArmazem.Application.Tests
```

## Autenticação

`POST /api/auth/login` recebe `{ "email": "...", "senha": "..." }` e retorna um token JWT.
O front guarda esse token no `localStorage` e o envia automaticamente como
`Authorization: Bearer {token}` em toda chamada autenticada. Todos os endpoints da API,
exceto o login, exigem esse token (`[Authorize]`).

Senhas são armazenadas com hash bcrypt (`BCrypt.Net-Next`). **Nunca reutilize a `SecretKey`
de exemplo do `appsettings.json` em produção.**

## Regras de negócio implementadas

- **RN01** — saída/transferência não pode resultar em saldo negativo (validado atomicamente
  no `UPDATE` do `EstoqueRepository`, reforçado por `CHECK` no banco).
- **RN02** — movimentações de estoque são somente-inserção (log auditável imutável).
- **RN03** — SKU de produto é único (validado na Application e reforçado por `UNIQUE` no banco).
- **RN05** — pedido de recebimento só é encerrado quando todos os itens forem totalmente recebidos.
- **RN06** — pedido de expedição só é expedido se houver saldo suficiente para **todos** os
  itens (tudo ou nada — se faltar saldo de qualquer item, nada é baixado do estoque).
- **RN08** — transferência debita origem e credita destino na mesma transação (`IUnitOfWork`).

Notas de implementação:
- **Pedidos de Recebimento**: a inserção de pedido+itens é atômica (transação local no
  repositório). Já a confirmação de item (entrada em estoque + atualização do pedido) é
  executada em passos sequenciais, não em uma única transação distribuída — suficiente para
  esta fase, mas um ponto a revisar se for necessário garantir atomicidade total no futuro.
- **Pedidos de Expedição**: diferente do recebimento, a expedição não reaproveita o
  `MovimentacaoService` porque precisa de uma única transação cobrindo múltiplos itens
  (RN06). Os detalhes estão comentados no `PedidoExpedicaoService`.

## Design do front-end

Paleta e tipografia ficam centralizadas em `frontend/src/index.css` (bloco `@theme` do
Tailwind v4):

- **Navy** (`--color-brand`) como cor primária — a mesma usada na documentação técnica do
  projeto, mantendo a identidade visual consistente entre os artefatos.
- **Âmbar** (`--color-accent`) como acento — referência à sinalização de armazém, não uma
  cor genérica de SaaS.
- **IBM Plex Sans** para texto de interface, **IBM Plex Mono** para dados técnicos (SKU,
  código de barras, quantidades, Ids) — a classe utilitária `.font-data` aplica essa fonte
  onde o dado precisa de escaneabilidade tipo planilha/ERP.

## Status

**Back-end**: núcleo funcional completo — Produtos, Estoque, Movimentações (entrada, saída,
transferência), Autenticação, Pedidos de Recebimento e Pedidos de Expedição, ponta a ponta
(Domain → Application → Infrastructure → API), com testes unitários das regras de negócio
críticas. Schema do banco aplicado automaticamente via DbUp.

**Front-end**: cobre todo o núcleo do backend — Login, Dashboard (visão geral), Produtos,
Estoque, Movimentações, Fornecedores, Clientes, Pedidos de Recebimento e Pedidos de Expedição.

Próximos passos possíveis: relatórios, múltiplos armazéns, permissões por perfil de usuário
no front, deploy.
