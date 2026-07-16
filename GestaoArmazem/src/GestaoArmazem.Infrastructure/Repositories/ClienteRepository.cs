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
}
