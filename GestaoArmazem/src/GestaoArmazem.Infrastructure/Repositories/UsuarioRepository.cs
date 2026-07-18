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

    public Task<IEnumerable<Usuario>> ListarAsync() =>
        _sql.Connection.QueryAsync<Usuario>("SELECT * FROM Usuario ORDER BY Nome", transaction: _sql.Transaction);

    public async Task<Guid> CriarAsync(Usuario usuario)
    {
        const string sql = @"
            INSERT INTO Usuario (Id, Nome, Email, SenhaHash, PerfilId)
            VALUES (@Id, @Nome, @Email, @SenhaHash, @PerfilId)";

        await _sql.Connection.ExecuteAsync(sql, usuario, _sql.Transaction);
        return usuario.Id;
    }

    public Task AtualizarSenhaHashAsync(Guid usuarioId, string novaSenhaHash) =>
        _sql.Connection.ExecuteAsync(
            "UPDATE Usuario SET SenhaHash = @SenhaHash WHERE Id = @Id",
            new { Id = usuarioId, SenhaHash = novaSenhaHash }, _sql.Transaction);
}
