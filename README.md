# Gestão de Armazém

Sistema de gestão de armazém (WMS) — controle de estoque, localizações, movimentações e pedidos.

## Stack

- Back-end: .NET 8 (Web API)
- Acesso a dados: Dapper
- Banco de dados: SQL Server
- Front-end: TypeScript + Tailwind CSS (a implementar)
- Autenticação: JWT

## IDEs recomendadas

- Back-end: Visual Studio 2026 (abra `GestaoArmazem.sln`)
- Front-end: VS Code
- Banco de dados: SQL Server Management Studio ou Azure Data Studio

## Estrutura da solução

```
src/
├── GestaoArmazem.Domain          # Entidades, enums, interfaces de repositório
├── GestaoArmazem.Application     # DTOs, validators, serviços (casos de uso)
├── GestaoArmazem.Infrastructure  # Repositórios Dapper, conexão com o banco
├── GestaoArmazem.API             # Controllers, Program.cs, configuração
└── database/scripts              # Scripts SQL versionados
tests/
└── GestaoArmazem.Application.Tests
```

## Como rodar

1. Suba um SQL Server local (ou use uma instância existente) e crie o banco `GestaoArmazem_Dev`.
2. Execute os scripts em `src/database/scripts` na ordem numérica (veja o README da pasta).
3. Ajuste a connection string em `src/GestaoArmazem.API/appsettings.Development.json` se necessário.
4. Abra `GestaoArmazem.sln` no Visual Studio 2026 e rode o projeto `GestaoArmazem.API`
   (ou `dotnet run --project src/GestaoArmazem.API`).
5. A API sobe com Swagger em `/swagger` no ambiente de desenvolvimento.

## Rodando os testes

```
dotnet test tests/GestaoArmazem.Application.Tests
```

## Regras de negócio implementadas nesta fatia vertical

- **RN01** — saída/transferência não pode resultar em saldo negativo (validado atomicamente no `UPDATE` do `EstoqueRepository`, reforçado por `CHECK` no banco).
- **RN02** — movimentações de estoque são somente-inserção (log auditável imutável).
- **RN03** — SKU de produto é único (validado na Application e reforçado por `UNIQUE` no banco).
- **RN05** — pedido de recebimento só é encerrado quando todos os itens forem totalmente recebidos.
- **RN08** — transferência debita origem e credita destino na mesma transação (`IUnitOfWork`).

## Pedidos de Recebimento

`POST /api/pedidos-recebimento` cria um pedido (Fornecedor + itens esperados), status inicial `Pendente`.

`POST /api/pedidos-recebimento/{id}/itens/{itemId}/confirmar-recebimento` confirma o recebimento
(total ou parcial) de um item: dá entrada no estoque via `MovimentacaoService` (mesma regra de
negócio usada pelo endpoint de entrada manual) e atualiza a quantidade recebida. Quando todos os
itens do pedido atingem a quantidade esperada, o pedido muda para `Concluido` automaticamente (RN05).
Enquanto isso não acontece, o pedido fica `EmAndamento`.

> Observação de implementação: a inserção de pedido+itens é atômica (transação local no
> repositório). Já a confirmação de item (entrada em estoque + atualização do pedido) é
> executada em passos sequenciais, não em uma única transação distribuída — suficiente para
> esta fase, mas um ponto a revisar se for necessário garantir atomicidade total no futuro.

## Autenticação

`POST /api/auth/login` recebe `{ "email": "...", "senha": "..." }` e retorna um token JWT.
Use o token no header `Authorization: Bearer {token}` para acessar os demais endpoints (todos protegidos com `[Authorize]`).

Usuário de desenvolvimento (criado pelo seed `0002_SeedData.sql`):
- Email: `admin@gestaoarmazem.local`
- Senha: `Admin@123`

Senhas são armazenadas com hash bcrypt (`BCrypt.Net-Next`). **Nunca reutilize a `SecretKey` de exemplo do `appsettings.json` em produção.**

## Status

Fatia vertical de referência implementada: **Produtos**, **Estoque**, **Movimentações**
(entrada, saída, transferência), **Autenticação (login + JWT)** e **Pedidos de Recebimento**
(criação + confirmação de recebimento com entrada automática em estoque), ponta a ponta —
Domain → Application → Infrastructure → API, com testes unitários das regras de negócio críticas.

Próximos passos: Pedidos de Expedição, DbUp para aplicar os scripts
automaticamente, e o front-end em TypeScript + Tailwind.

