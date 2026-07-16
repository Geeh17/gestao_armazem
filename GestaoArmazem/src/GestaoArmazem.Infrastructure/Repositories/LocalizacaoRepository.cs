using Dapper;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;
using GestaoArmazem.Infrastructure.Data;

namespace GestaoArmazem.Infrastructure.Repositories;

public class LocalizacaoRepository : ILocalizacaoRepository
{
    private readonly ISqlContext _sql;

    public LocalizacaoRepository(ISqlContext sql)
    {
        _sql = sql;
    }

    public Task<Localizacao?> ObterPorIdAsync(Guid id) =>
        _sql.Connection.QuerySingleOrDefaultAsync<Localizacao?>(
            "SELECT * FROM Localizacao WHERE Id = @Id",
            new { Id = id }, _sql.Transaction);

    public Task<IEnumerable<Localizacao>> ListarPorArmazemAsync(Guid armazemId) =>
        _sql.Connection.QueryAsync<Localizacao>(
            "SELECT * FROM Localizacao WHERE ArmazemId = @ArmazemId ORDER BY Codigo",
            new { ArmazemId = armazemId }, _sql.Transaction);

    public async Task<Guid> CriarAsync(Localizacao localizacao)
    {
        const string sql = @"
            INSERT INTO Localizacao (Id, ArmazemId, Corredor, Prateleira, Nivel, Codigo)
            VALUES (@Id, @ArmazemId, @Corredor, @Prateleira, @Nivel, @Codigo)";

        await _sql.Connection.ExecuteAsync(sql, localizacao, _sql.Transaction);
        return localizacao.Id;
    }
}
