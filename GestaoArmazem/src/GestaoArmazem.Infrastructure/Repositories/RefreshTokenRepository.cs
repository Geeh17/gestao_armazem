using Dapper;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;
using GestaoArmazem.Infrastructure.Data;

namespace GestaoArmazem.Infrastructure.Repositories;

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly ISqlContext _sql;

    public RefreshTokenRepository(ISqlContext sql)
    {
        _sql = sql;
    }

    public Task<RefreshToken?> ObterPorTokenAsync(string token) =>
        _sql.Connection.QuerySingleOrDefaultAsync<RefreshToken?>(
            "SELECT * FROM RefreshToken WHERE Token = @Token", new { Token = token }, _sql.Transaction);

    public async Task CriarAsync(RefreshToken refreshToken)
    {
        const string sql = @"
            INSERT INTO RefreshToken (Id, UsuarioId, Token, ExpiraEm, Revogado, CriadoEm)
            VALUES (@Id, @UsuarioId, @Token, @ExpiraEm, @Revogado, @CriadoEm)";

        await _sql.Connection.ExecuteAsync(sql, refreshToken, _sql.Transaction);
    }

    public Task RevogarAsync(Guid id) =>
        _sql.Connection.ExecuteAsync(
            "UPDATE RefreshToken SET Revogado = 1 WHERE Id = @Id", new { Id = id }, _sql.Transaction);
}
