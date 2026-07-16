# Scripts de banco de dados

Scripts T-SQL versionados, aplicados em ordem numérica.

- `0001_CreateSchema.sql` — cria todas as tabelas do modelo de dados.
- `0002_SeedData.sql` — dados iniciais para desenvolvimento (perfis, categorias, armazém padrão).

## Como aplicar (manualmente, por enquanto)

No SQL Server Management Studio ou `sqlcmd`, execute os scripts em ordem contra o banco `GestaoArmazem` (ou `GestaoArmazem_Dev`, conforme `appsettings.Development.json`):

```
sqlcmd -S localhost -d GestaoArmazem -i 0001_CreateSchema.sql
sqlcmd -S localhost -d GestaoArmazem -i 0002_SeedData.sql
```

## Próximo passo

Integrar um runner automático (DbUp ou FluentMigrator) para aplicar os scripts pendentes
automaticamente na inicialização da API em ambiente de desenvolvimento.
