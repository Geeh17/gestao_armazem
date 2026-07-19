using Dapper;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;
using GestaoArmazem.Infrastructure.Data;

namespace GestaoArmazem.Infrastructure.Repositories;

public class ClienteRepository : IClienteRepository
{
    private readonly ISqlContext _sql;

    public ClienteRepository(ISqlContext sql)
    {
        _sql = sql;
    }

    public Task<Cliente?> ObterPorIdAsync(Guid id) =>
        _sql.Connection.QuerySingleOrDefaultAsync<Cliente?>(
            "SELECT * FROM Cliente WHERE Id = @Id",
            new { Id = id }, _sql.Transaction);

    public Task<IEnumerable<Cliente>> ListarAsync() =>
        _sql.Connection.QueryAsync<Cliente>(
            "SELECT * FROM Cliente ORDER BY Nome", transaction: _sql.Transaction);

    public async Task<Guid> CriarAsync(Cliente cliente)
    {
        const string sql = @"
            INSERT INTO Cliente (Id, Nome, Documento, Contato)
            VALUES (@Id, @Nome, @Documento, @Contato)";

        await _sql.Connection.ExecuteAsync(sql, cliente, _sql.Transaction);
        return cliente.Id;
    }

    public Task AtualizarAsync(Cliente cliente)
    {
        const string sql = "UPDATE Cliente SET Nome = @Nome, Documento = @Documento, Contato = @Contato WHERE Id = @Id";
        return _sql.Connection.ExecuteAsync(sql, cliente, _sql.Transaction);
    }

    public async Task<bool> PossuiReferenciasAsync(Guid id)
    {
        const string sql = "SELECT CASE WHEN EXISTS (SELECT 1 FROM PedidoExpedicao WHERE ClienteId = @Id) THEN 1 ELSE 0 END";
        return await _sql.Connection.ExecuteScalarAsync<bool>(sql, new { Id = id }, _sql.Transaction);
    }

    public Task ExcluirAsync(Guid id) =>
        _sql.Connection.ExecuteAsync("DELETE FROM Cliente WHERE Id = @Id", new { Id = id }, _sql.Transaction);
}
