using Dapper;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;
using GestaoArmazem.Infrastructure.Data;

namespace GestaoArmazem.Infrastructure.Repositories;

public class UsuarioRepository : IUsuarioRepository
{
    private readonly ISqlContext _sql;

    public UsuarioRepository(ISqlContext sql)
    {
        _sql = sql;
    }

    public Task<Usuario?> ObterPorEmailAsync(string email) =>
        _sql.Connection.QuerySingleOrDefaultAsync<Usuario?>(
            "SELECT * FROM Usuario WHERE Email = @Email",
            new { Email = email }, _sql.Transaction);

    public Task<Usuario?> ObterPorIdAsync(Guid id) =>
        _sql.Connection.QuerySingleOrDefaultAsync<Usuario?>(
            "SELECT * FROM Usuario WHERE Id = @Id",
            new { Id = id }, _sql.Transaction);
}
