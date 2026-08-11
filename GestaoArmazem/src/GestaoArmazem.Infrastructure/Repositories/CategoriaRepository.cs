using Dapper;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;
using GestaoArmazem.Infrastructure.Data;

namespace GestaoArmazem.Infrastructure.Repositories;

public class CategoriaRepository : ICategoriaRepository
{
    private readonly ISqlContext _sql;

    public CategoriaRepository(ISqlContext sql)
    {
        _sql = sql;
    }

    public Task<Categoria?> ObterPorIdAsync(Guid id) =>
        _sql.Connection.QuerySingleOrDefaultAsync<Categoria?>(
            "SELECT * FROM Categoria WHERE Id = @Id", new { Id = id }, _sql.Transaction);

    public Task<IEnumerable<Categoria>> ListarAsync() =>
        _sql.Connection.QueryAsync<Categoria>(
            "SELECT * FROM Categoria ORDER BY Nome", transaction: _sql.Transaction);

    public async Task<Guid> CriarAsync(Categoria categoria)
    {
        const string sql = "INSERT INTO Categoria (Id, Nome) VALUES (@Id, @Nome)";
        await _sql.Connection.ExecuteAsync(sql, categoria, _sql.Transaction);
        return categoria.Id;
    }

    public Task AtualizarAsync(Categoria categoria)
    {
        const string sql = "UPDATE Categoria SET Nome = @Nome WHERE Id = @Id";
        return _sql.Connection.ExecuteAsync(sql, categoria, _sql.Transaction);
    }

    public async Task<bool> PossuiReferenciasAsync(Guid id)
    {
        const string sql = "SELECT CASE WHEN EXISTS (SELECT 1 FROM Produto WHERE CategoriaId = @Id) THEN 1 ELSE 0 END";
        return await _sql.Connection.ExecuteScalarAsync<bool>(sql, new { Id = id }, _sql.Transaction);
    }

    public Task ExcluirAsync(Guid id) =>
        _sql.Connection.ExecuteAsync("DELETE FROM Categoria WHERE Id = @Id", new { Id = id }, _sql.Transaction);
}
