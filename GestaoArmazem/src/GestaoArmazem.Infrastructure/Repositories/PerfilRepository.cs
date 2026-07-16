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
}
