using Dapper;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;
using GestaoArmazem.Infrastructure.Data;

namespace GestaoArmazem.Infrastructure.Repositories;

public class PerfilRepository : IPerfilRepository
{
    private readonly ISqlContext _sql;

    public PerfilRepository(ISqlContext sql)
    {
        _sql = sql;
    }

    public Task<Perfil?> ObterPorIdAsync(Guid id) =>
        _sql.Connection.QuerySingleOrDefaultAsync<Perfil?>(
            "SELECT * FROM Perfil WHERE Id = @Id",
            new { Id = id }, _sql.Transaction);

    public Task<IEnumerable<Perfil>> ListarAsync() =>
        _sql.Connection.QueryAsync<Perfil>("SELECT * FROM Perfil ORDER BY Nome", transaction: _sql.Transaction);

    public async Task<Guid> CriarAsync(Perfil perfil)
    {
        const string sql = "INSERT INTO Perfil (Id, Nome) VALUES (@Id, @Nome)";
        await _sql.Connection.ExecuteAsync(sql, perfil, _sql.Transaction);
        return perfil.Id;
    }
}
