using Dapper;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;
using GestaoArmazem.Infrastructure.Data;

namespace GestaoArmazem.Infrastructure.Repositories;

public class EstoqueRepository : IEstoqueRepository
{
    private readonly ISqlContext _sql;

    public EstoqueRepository(ISqlContext sql)
    {
        _sql = sql;
    }

    public Task<Estoque?> ObterAsync(Guid produtoId, Guid localizacaoId) =>
        _sql.Connection.QuerySingleOrDefaultAsync<Estoque?>(
            "SELECT * FROM Estoque WHERE ProdutoId = @ProdutoId AND LocalizacaoId = @LocalizacaoId",
            new { ProdutoId = produtoId, LocalizacaoId = localizacaoId }, _sql.Transaction);

    public Task<IEnumerable<Estoque>> ConsultarPorProdutoAsync(Guid produtoId) =>
        _sql.Connection.QueryAsync<Estoque>(
            "SELECT * FROM Estoque WHERE ProdutoId = @ProdutoId",
            new { ProdutoId = produtoId }, _sql.Transaction);

    public Task IncrementarAsync(Guid produtoId, Guid localizacaoId, int quantidade)
    {
        // MERGE: cria o registro de saldo se não existir, ou incrementa se já existir.
        const string sql = @"
            MERGE Estoque AS target
            USING (SELECT @ProdutoId AS ProdutoId, @LocalizacaoId AS LocalizacaoId) AS source
                ON target.ProdutoId = source.ProdutoId AND target.LocalizacaoId = source.LocalizacaoId
            WHEN MATCHED THEN
                UPDATE SET Quantidade = target.Quantidade + @Quantidade
            WHEN NOT MATCHED THEN
                INSERT (ProdutoId, LocalizacaoId, Quantidade)
                VALUES (@ProdutoId, @LocalizacaoId, @Quantidade);";

        return _sql.Connection.ExecuteAsync(sql,
            new { ProdutoId = produtoId, LocalizacaoId = localizacaoId, Quantidade = quantidade },
            _sql.Transaction);
    }

    public async Task<bool> TentarDecrementarAsync(Guid produtoId, Guid localizacaoId, int quantidade)
    {
        // RN01: a atualização só ocorre se houver saldo suficiente — evita saldo negativo
        // mesmo sob concorrência, pois a condição é avaliada atomicamente pelo próprio UPDATE.
        const string sql = @"
            UPDATE Estoque
            SET Quantidade = Quantidade - @Quantidade
            WHERE ProdutoId = @ProdutoId
              AND LocalizacaoId = @LocalizacaoId
              AND Quantidade >= @Quantidade";

        var linhasAfetadas = await _sql.Connection.ExecuteAsync(sql,
            new { ProdutoId = produtoId, LocalizacaoId = localizacaoId, Quantidade = quantidade },
            _sql.Transaction);

        return linhasAfetadas > 0;
    }
}
