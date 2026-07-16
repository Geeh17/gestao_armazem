# Scripts de banco de dados

Scripts T-SQL versionados, aplicados em ordem numérica pelo DbUp (`src/GestaoArmazem.Database`).

- `0001_CreateSchema.sql` — cria todas as tabelas do modelo de dados.
- `0002_SeedData.sql` — dados iniciais para desenvolvimento (perfis, categorias, usuário admin, armazém padrão).

Os scripts em si continuam aqui (fonte única de verdade). O projeto `GestaoArmazem.Database`
os embute como recursos e os aplica em ordem contra o banco, registrando o que já foi
executado numa tabela `dbo.SchemaVersions` — rodar de novo não repete scripts já aplicados.

## Automático (Development)

Ao rodar a API em ambiente `Development`, os scripts pendentes são aplicados automaticamente
antes da API subir (ver `Program.cs`). O banco também é criado se ainda não existir. Isso é
controlado por `Database:AutoMigrate` em `appsettings.Development.json` (default: `true`).

Para desligar esse comportamento (por exemplo, se preferir aplicar manualmente), defina
`"Database": { "AutoMigrate": false }`.

## Manual / CI-CD

Para aplicar os scripts sem subir a API (útil em pipelines ou para preparar um ambiente novo):

```
dotnet run --project src/GestaoArmazem.Database -- "Server=localhost;Database=GestaoArmazem;Trusted_Connection=True;TrustServerCertificate=True;"
```

Ou definindo a connection string por variável de ambiente:

```
export GESTAOARMAZEM_CONNECTION="Server=localhost;Database=GestaoArmazem;Trusted_Connection=True;TrustServerCertificate=True;"
dotnet run --project src/GestaoArmazem.Database
```

O comando retorna código de saída `0` em caso de sucesso e `1` em caso de falha (útil para
falhar o pipeline de CI/CD se algum script tiver erro).

## Adicionando um novo script

1. Crie um novo arquivo em `src/database/scripts`, seguindo a numeração sequencial
   (ex.: `0003_MinhaAlteracao.sql`).
2. Não edite scripts já aplicados em algum ambiente — o DbUp não vai rodá-los de novo, e
   editar um script já executado é uma fonte comum de divergência entre ambientes.
3. Rode a API em Development (ou o comando manual acima) para aplicar o novo script.

