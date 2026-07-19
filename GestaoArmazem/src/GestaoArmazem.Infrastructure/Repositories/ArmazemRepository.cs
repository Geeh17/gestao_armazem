using Dapper;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;
using GestaoArmazem.Infrastructure.Data;

namespace GestaoArmazem.Infrastructure.Repositories;

public class ArmazemRepository : IArmazemRepository
{
    private readonly ISqlContext _sql;

    public ArmazemRepository(ISqlContext sql)
    {
        _sql = sql;
    }

    public Task<Armazem?> ObterPorIdAsync(Guid id) =>
        _sql.Connection.QuerySingleOrDefaultAsync<Armazem?>(
            "SELECT * FROM Armazem WHERE Id = @Id", new { Id = id }, _sql.Transaction);

    public Task<IEnumerable<Armazem>> ListarAsync() =>
        _sql.Connection.QueryAsync<Armazem>("SELECT * FROM Armazem ORDER BY Nome", transaction: _sql.Transaction);

    public async Task<Guid> CriarAsync(Armazem armazem)
    {
        const string sql = "INSERT INTO Armazem (Id, Nome, Endereco) VALUES (@Id, @Nome, @Endereco)";
        await _sql.Connection.ExecuteAsync(sql, armazem, _sql.Transaction);
        return armazem.Id;
    }

    public Task AtualizarAsync(Armazem armazem)
    {
        const string sql = "UPDATE Armazem SET Nome = @Nome, Endereco = @Endereco WHERE Id = @Id";
        return _sql.Connection.ExecuteAsync(sql, armazem, _sql.Transaction);
    }

    public async Task<bool> PossuiReferenciasAsync(Guid id)
    {
        const string sql = "SELECT CASE WHEN EXISTS (SELECT 1 FROM Localizacao WHERE ArmazemId = @Id) THEN 1 ELSE 0 END";
        return await _sql.Connection.ExecuteScalarAsync<bool>(sql, new { Id = id }, _sql.Transaction);
    }

    public Task ExcluirAsync(Guid id) =>
        _sql.Connection.ExecuteAsync("DELETE FROM Armazem WHERE Id = @Id", new { Id = id }, _sql.Transaction);
}
