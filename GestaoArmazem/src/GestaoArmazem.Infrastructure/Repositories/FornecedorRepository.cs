using Dapper;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;
using GestaoArmazem.Infrastructure.Data;

namespace GestaoArmazem.Infrastructure.Repositories;

public class FornecedorRepository : IFornecedorRepository
{
    private readonly ISqlContext _sql;

    public FornecedorRepository(ISqlContext sql)
    {
        _sql = sql;
    }

    public Task<Fornecedor?> ObterPorIdAsync(Guid id) =>
        _sql.Connection.QuerySingleOrDefaultAsync<Fornecedor?>(
            "SELECT * FROM Fornecedor WHERE Id = @Id",
            new { Id = id }, _sql.Transaction);

    public Task<IEnumerable<Fornecedor>> ListarAsync() =>
        _sql.Connection.QueryAsync<Fornecedor>(
            "SELECT * FROM Fornecedor ORDER BY Nome", transaction: _sql.Transaction);

    public async Task<Guid> CriarAsync(Fornecedor fornecedor)
    {
        const string sql = @"
            INSERT INTO Fornecedor (Id, Nome, CNPJ, Contato)
            VALUES (@Id, @Nome, @CNPJ, @Contato)";

        await _sql.Connection.ExecuteAsync(sql, fornecedor, _sql.Transaction);
        return fornecedor.Id;
    }

    public Task AtualizarAsync(Fornecedor fornecedor)
    {
        const string sql = "UPDATE Fornecedor SET Nome = @Nome, CNPJ = @CNPJ, Contato = @Contato WHERE Id = @Id";
        return _sql.Connection.ExecuteAsync(sql, fornecedor, _sql.Transaction);
    }

    public async Task<bool> PossuiReferenciasAsync(Guid id)
    {
        const string sql = "SELECT CASE WHEN EXISTS (SELECT 1 FROM PedidoRecebimento WHERE FornecedorId = @Id) THEN 1 ELSE 0 END";
        return await _sql.Connection.ExecuteScalarAsync<bool>(sql, new { Id = id }, _sql.Transaction);
    }

    public Task ExcluirAsync(Guid id) =>
        _sql.Connection.ExecuteAsync("DELETE FROM Fornecedor WHERE Id = @Id", new { Id = id }, _sql.Transaction);
}
