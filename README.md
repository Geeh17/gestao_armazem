# Gestão de Armazém

Sistema de gestão de armazém (WMS) — controle de estoque, localizações, movimentações e
pedidos de recebimento/expedição. Full-stack: API em .NET, front-end em React.

## Stack

| Camada         | Tecnologia                                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| Back-end       | .NET 8 (Web API)                                                                                           |
| Acesso a dados | Dapper                                                                                                     |
| Banco de dados | SQL Server                                                                                                 |
| Migrações      | DbUp (`GestaoArmazem.Database`)                                                                            |
| Autenticação   | JWT + refresh token (bcrypt para hash de senha)                                                            |
| Logging        | Serilog (console + arquivo)                                                                                |
| Testes         | xUnit + Moq (back-end), Vitest + Testing Library (front-end), testes de integração contra SQL Server local |
| Front-end      | React 19 + TypeScript, Vite 8                                                                              |
| Estilização    | Tailwind CSS v4                                                                                            |

## Estrutura do repositório

```
├── GestaoArmazem/                          # Back-end (.NET)
│   ├── src/
│   │   ├── GestaoArmazem.Domain             # Entidades, enums, interfaces de repositório
│   │   ├── GestaoArmazem.Application        # DTOs, validators, serviços (casos de uso)
│   │   ├── GestaoArmazem.Infrastructure     # Repositórios Dapper, conexão com o banco
│   │   ├── GestaoArmazem.API                # Controllers, Program.cs, health check, configuração
│   │   ├── GestaoArmazem.Database           # Runner DbUp: aplica os scripts SQL
│   │   └── database/scripts                 # Scripts SQL versionados (fonte única de verdade)
│   └── tests/
│       ├── GestaoArmazem.Application.Tests  # Unitários (xUnit + Moq, mockam os repositórios)
│       └── GestaoArmazem.IntegrationTests   # Contra SQL Server real, ponta a ponta via HTTP
│
├── Front/                                    # Front-end (React + TypeScript + Tailwind)
│   └── src/
│       ├── api/            # Client HTTP + chamadas por recurso (auth, produtos, ...)
│       ├── components/
│       │   ├── layout/     # Sidebar, AppShell, ProtectedRoute, AdminRoute
│       │   └── ui/         # Button, Input, Select, Alert, StatusBadge, Pagination
│       ├── context/        # AuthContext, ToastContext, DialogContext
│       ├── lib/            # Utilitários (ex.: decodificação de JWT)
│       ├── pages/          # Uma página por rota
│       ├── types/          # Tipos espelhando os DTOs do backend
│       └── App.tsx         # Definição das rotas
│       # Não há uma pasta tests/ separada aqui: cada *.test.ts(x) fica ao lado do
│       # arquivo que testa (ex.: pages/ProdutosListPage.tsx e
│       # pages/ProdutosListPage.test.tsx no mesmo lugar) — convenção comum em
│       # projetos Vitest/React, diferente da pasta tests/ à parte do .NET acima.
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
   `GET /health` confirma a conectividade com o banco (sem autenticação).

### 2. Front-end

1. Em outro terminal:
   ```
   cd Front
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

### Rodando os testes

Back-end (unitários — mockam os repositórios, não tocam banco):

```
dotnet test GestaoArmazem/tests/GestaoArmazem.Application.Tests
```

Back-end (integração — contra SQL Server real, ver seção "Observabilidade, Segurança e
Testes de Integração"):

```
dotnet test GestaoArmazem/tests/GestaoArmazem.IntegrationTests
```

Front-end (a partir de `Front/`, com as dependências já instaladas):

```
npm test          # roda uma vez e sai (bom para CI)
npm run test:watch  # fica observando os arquivos
```

## Autenticação

`POST /api/auth/login` recebe `{ "email": "...", "senha": "..." }` e retorna um access token
JWT (curta duração, padrão 60 min) **e** um refresh token (padrão 7 dias). O front guarda os
dois no `localStorage` e envia o access token automaticamente como `Authorization: Bearer
{token}` em toda chamada autenticada.

Quando a API responde 401, o front tenta renovar o access token automaticamente via
`POST /api/auth/refresh` e refaz a chamada original — o usuário não percebe a renovação.
A renovação usa **rotação**: o refresh token usado é revogado e um novo par é emitido junto,
então se um token roubado for usado depois do legítimo, a sessão já foi invalidada. Chamadas
simultâneas que tomam 401 ao mesmo tempo compartilham a mesma renovação (não disparam várias
em paralelo). `POST /api/auth/logout` revoga o refresh token explicitamente.

O login tem rate limit: **5 tentativas por minuto por IP** (`429 Too Many Requests` acima
disso). Senhas são armazenadas com hash bcrypt (`BCrypt.Net-Next`). **Nunca reutilize a
`SecretKey` de exemplo do `appsettings.json` em produção.**

## Relatórios

- `GET /api/relatorios/estoque-baixo` — produtos cujo saldo total (somado em todas as
  localizações) está abaixo do estoque mínimo cadastrado.
- `GET /api/relatorios/movimentacoes` — histórico de movimentações com filtros opcionais
  (`produtoId`, `tipo`, `dataInicio`, `dataFim`, paginação).

Essas consultas ficam num repositório dedicado (`IRelatorioRepository`), separado dos
repositórios de escrita, já que são projeções agregadas que não pertencem a um único agregado.

## Usuários e Permissões

- `GET/POST/PUT/DELETE /api/perfis` e `/api/usuarios` — restritos a usuários com perfil
  `Administrador` (`[Authorize(Roles = "Administrador")]`, RN07). O front também esconde
  os menus "Usuários" e "Perfis" e bloqueia a rota (`AdminRoute`) para quem não é admin —
  mas a garantia de verdade é sempre a do backend.
- `POST /api/usuarios/{id}/resetar-senha` — Administrador redefine a senha de outro usuário
  sem precisar saber a senha atual (diferente de `POST /api/auth/alterar-senha`, que qualquer
  usuário logado usa pra trocar a própria senha, exigindo a senha atual).
- Excluir um usuário é bloqueado se ele já registrou alguma movimentação de estoque —
  protege o log auditável (RN02): a movimentação continua existindo, mas o autor dela não
  pode ser apagado do sistema.
- O token JWT carrega `role` e `name` como claims curtas (não as URIs longas de
  `ClaimTypes.*`), pra facilitar decodificar no front (`src/lib/jwt.ts`).

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

## Ajuste de Estoque, Categorias, Editar/Excluir e Cancelar

- `POST /api/movimentacoes/ajuste` — corrige o saldo de um produto numa localização para o
  valor exatamente contado numa conferência física (não é um delta como entrada/saída): a
  API calcula a diferença contra o saldo atual, credita ou debita conforme o sinal, e
  registra uma `MovimentacaoEstoque` com `Tipo=Ajuste` (e `Motivo` opcional) para manter o
  histórico auditável.
- `GET/POST/PUT/DELETE /api/categorias` — CRUD completo; excluir é bloqueado se houver
  produto associado à categoria.
- Produtos, Categorias, Fornecedores, Clientes, Armazéns e Localizações têm `PUT` (editar) e
  `DELETE` (excluir) na API. Antes de excluir, cada endpoint verifica se o registro está
  referenciado em outra tabela (estoque, movimentações, itens de pedido, pedidos) e bloqueia
  com uma mensagem clara em vez de deixar estourar um erro de FK constraint. Produto não
  permite editar o SKU; Localização não permite trocar de Armazém (crie uma nova localização
  nesse caso).
- Pedidos de Recebimento e Expedição podem ser cancelados (`POST {id}/cancelar`) enquanto
  não estiverem `Concluido` ou já `Cancelado`.

## Paginação e Diálogos in-app

Produtos e as duas listas de Pedidos usam paginação Anterior/Próxima
(`components/ui/Pagination.tsx`). Como a API não retorna contagem total de registros, o
front busca um item a mais que o tamanho da página só para saber se existe próxima.

Confirmações e exclusões usam um diálogo in-app (`DialogContext` / `useDialog`) no lugar do
`window.confirm`/`window.prompt` nativo do navegador — mais consistente com o resto do
visual. Ações de sucesso mostram um toast (`ToastContext` / `useToast`) no canto da tela por
alguns segundos, em vez de um alerta fixo na página.

## Observabilidade, Segurança e Testes de Integração

- **Health check**: `GET /health` (sem autenticação) testa a conectividade real com o banco
  (abre uma conexão e roda `SELECT 1`) — útil pra saber se a API está "viva de verdade", não
  só se o processo está de pé.
- **Rate limit**: login limitado a 5 tentativas por minuto por IP (`429 Too Many Requests`
  acima disso), mitigando força bruta de senha.
- **Logging estruturado** via Serilog: console + arquivo com rotação diária (`logs/`, fora do
  controle de versão), registrando método/path/status/duração de cada requisição
  (configurável em `appsettings.json`, seção `Serilog`).
- **Testes de integração** (`GestaoArmazem.IntegrationTests`) usam a mesma instância de SQL
  Server local do resto do projeto — sem Docker. Criam um banco `GestaoArmazem_IntegrationTests`,
  aplicam os scripts via DbUp, testam a API ponta a ponta por HTTP, e apagam o banco no final
  (inclusive limpando de uma execução anterior interrompida). Por padrão conectam em
  `.\SQLEXPRESS`; se sua instância tiver outro nome, veja
  `tests/GestaoArmazem.IntegrationTests/README.md` para configurar via variável de ambiente.

Diferente dos testes unitários — que mockam os repositórios e nunca tocam SQL de verdade —
os testes de integração pegam bugs de SQL real. Foi assim que um bug de ordem de colunas no
relatório de estoque baixo passou despercebido pelos testes unitários do back-end.

## Antes de ir para produção

Duas checagens de segurança que valem a pena revisar antes de expor essa API além do seu
ambiente local:

- **`Jwt:SecretKey`**: a API **se recusa a subir** (lança exceção no startup) fora do
  ambiente `Development` se a chave continuar sendo o placeholder do `appsettings.json`
  ou tiver menos de 32 caracteres. Defina uma chave forte de verdade via variável de
  ambiente (`Jwt__SecretKey`) ou um secret store — nunca deixe o valor do
  `appsettings.json` versionado ser o que roda em produção.
- **Seed de dados** (`0002_SeedData.sql`) cria um usuário `Administrador` com senha
  conhecida (`admin@gestaoarmazem.local` / `Admin@123`, documentada neste próprio README).
  A API só aplica esse script automaticamente em `Development`. Se for inicializar um
  banco novo manualmente via `GestaoArmazem.Database` (o CLI do DbUp), o seed **não é
  aplicado por padrão** — é preciso passar `--seed` explicitamente:
  ```
  dotnet run --project src/GestaoArmazem.Database -- "<connection string>"          # só schema
  dotnet run --project src/GestaoArmazem.Database -- "<connection string>" --seed   # schema + seed (dev/local)
  ```
  Se algum ambiente fora de local/desenvolvimento acabar com esse usuário, troque a senha
  (ou exclua o usuário, via `DELETE /api/usuarios/{id}` como Administrador) imediatamente.
- **CORS**: por padrão a API só aceita requisições de `http://localhost:5173` (config
  `AllowedOrigins`, sem valor no `appsettings.json`). Fora do seu ambiente local, defina
  essa configuração com a URL real do front — sem isso, o navegador bloqueia as chamadas
  mesmo que a API esteja funcionando normalmente.

## Testes do Back-end

**Unitários** (`GestaoArmazem.Application.Tests`, xUnit + Moq): cobrem as regras de negócio
críticas com os repositórios mockados — nunca tocam banco de dados real.

```
dotnet test GestaoArmazem/tests/GestaoArmazem.Application.Tests
```

**Integração** (`GestaoArmazem.IntegrationTests`): contra SQL Server real, sem Docker — ver a
seção "Observabilidade, Segurança e Testes de Integração" acima para detalhes completos
(o que está coberto, como configurar outra instância, por que isso importa).

```
dotnet test GestaoArmazem/tests/GestaoArmazem.IntegrationTests
```

## Testes do Front-end

Vitest + Testing Library, configurado em `Front/vite.config.ts` (roda em `jsdom`, sem
depender de nenhum navegador real). **177 testes em 37 arquivos**, cobrindo:

- **As 21 páginas da aplicação** (`src/pages`) — uma por rota, sem exceção: da tela de login
  até os fluxos mais delicados, como confirmação de recebimento item a item e expedição
  tudo-ou-nada (RN06).
- **Componentes de UI** (`src/components/ui`) — Button, Input, Select, Alert, StatusBadge,
  Pagination.
- **Layout e permissões** (`src/components/layout`) — `Sidebar` (itens `adminOnly` escondidos
  para quem não é Administrador), `ProtectedRoute`, `AdminRoute`, `AppShell`.
- **Contextos** (`src/context`) — `AuthContext` (login/logout/`isAdmin`), `ToastContext`,
  `DialogContext`.
- **Bibliotecas utilitárias** (`src/lib`) — decodificação de JWT, formatação de localização
  entre armazéns diferentes (o código de uma localização só é único dentro do próprio
  armazém — esse é o caso que mais importa testar).
- **Client HTTP** (`src/api/client.ts`) — injeção do Bearer token, renovação automática de
  sessão em respostas 401 (incluindo chamadas simultâneas compartilhando a mesma renovação),
  tratamento do erro `{ erro: "..." }` do backend.

Rodando (a partir de `Front/`, com as dependências já instaladas):

```
npm test           # roda uma vez e sai (bom para CI)
npm run test:watch # fica observando os arquivos
```

Assim como no back-end, esses testes mockam suas dependências (`fetch`, os módulos de
`src/api/*`) — não substituem testar a aplicação de ponta a ponta no navegador antes de usar
em produção, mas pegam regressões de lógica, permissão e formatação sem precisar da API no ar.

## Design do front-end

Paleta e tipografia ficam centralizadas em `Front/src/index.css` (bloco `@theme` do
Tailwind v4):

- **Navy** (`--color-brand`) como cor primária — a mesma usada na documentação técnica do
  projeto, mantendo a identidade visual consistente entre os artefatos.
- **Âmbar** (`--color-accent`) como acento — referência à sinalização de armazém, não uma
  cor genérica de SaaS.
- **IBM Plex Sans** para texto de interface, **IBM Plex Mono** para dados técnicos (SKU,
  código de barras, quantidades, Ids) — a classe utilitária `.font-data` aplica essa fonte
  onde o dado precisa de escaneabilidade tipo planilha/ERP.

## Status

**Back-end**: núcleo funcional completo — Produtos, Categorias, Armazéns, Localizações,
Estoque, Movimentações (entrada, saída, transferência, ajuste), Autenticação (login, refresh
token, logout, rate limit), Fornecedores, Clientes, Pedidos de Recebimento e Expedição
(incluindo cancelamento), Usuários e Perfis (com edição/exclusão e reset de senha),
Relatórios, editar/excluir com checagem de dependências, health check e logging estruturado —
ponta a ponta (Domain → Application → Infrastructure → API), com testes unitários das regras
de negócio críticas e testes de integração contra SQL Server real. Schema do banco aplicado
automaticamente via DbUp.

**Front-end**: cobre todo o núcleo do backend — Login (com renovação automática de sessão),
Dashboard, Produtos, Categorias, Armazéns, Localizações, Estoque, Movimentações (incluindo
Ajuste), Fornecedores, Clientes, Pedidos de Recebimento, Pedidos de Expedição (ambos com
paginação), Relatórios, Usuários e Perfis (RN07: só Administrador acessa, com edição/exclusão/
reset de senha), e troca de senha (qualquer usuário logado). Suporta múltiplos armazéns: toda
tela que mostra ou seleciona uma localização exibe também o nome do armazém, já que o código
de uma localização só é único dentro do próprio armazém. Produtos, Categorias, Fornecedores,
Clientes, Armazéns, Localizações e Usuários têm edição e exclusão. Pedidos podem ser
cancelados enquanto não estiverem concluídos. Confirmações e exclusões usam diálogos in-app
(não `window.confirm`), com feedback via toast. 177 testes automatizados (Vitest + Testing
Library) cobrindo toda página e componente da aplicação.
