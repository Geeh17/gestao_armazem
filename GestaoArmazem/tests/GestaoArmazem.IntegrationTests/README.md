# Testes de Integração

Usam um banco de dados real (`GestaoArmazem_IntegrationTests`) na mesma instância de SQL
Server local que você já usa para rodar a API, aplicam os mesmos scripts de
`src/database/scripts` via DbUp, e testam a API ponta a ponta por HTTP
(`WebApplicationFactory`) — diferente dos testes unitários, que mockam os repositórios e
nunca tocam SQL de verdade.

Não precisa de Docker: a fixture cria o banco de teste, roda os testes, e apaga o banco no
final (mesmo se a suíte anterior tiver sido interrompida no meio).

## Requisitos

- A mesma instância de SQL Server que você já usa para o resto do projeto, acessível.

## Rodando

```
dotnet test tests/GestaoArmazem.IntegrationTests
```

Por padrão conecta em `.\SQLEXPRESS`. Se a sua instância tiver outro nome, defina a variável
de ambiente `GESTAOARMAZEM_TEST_CONNECTION` com a connection string completa (apontando para
`Database=master` — o nome do banco de teste é substituído automaticamente) antes de rodar:

```
set GESTAOARMAZEM_TEST_CONNECTION=Server=.\SQLEXPRESS;Database=master;Trusted_Connection=True;TrustServerCertificate=True;
dotnet test tests/GestaoArmazem.IntegrationTests
```

## O que está coberto

`FluxoEstoqueTests`:
- Login com credenciais válidas/inválidas
- Fluxo completo criar produto → entrada → saída → saída excessiva (RN01), conferindo o
  saldo real via `GET /api/estoque` a cada passo
- Relatório de estoque baixo desserializa sem erro (esse é o teste que teria pego o bug de
  ordem de colunas do `SELECT` que passou despercebido pelos testes unitários)
- Endpoint autenticado sem token retorna 401

## Por que isso importa

Testes unitários com repositório mockado não pegam erros de SQL — foi exatamente esse
tipo de bug (ordem de colunas do `SELECT` batendo errado com um `record` posicional,
no relatório de estoque baixo) que passou despercebido pelos testes unitários e só
apareceu ao testar contra o banco de verdade.
