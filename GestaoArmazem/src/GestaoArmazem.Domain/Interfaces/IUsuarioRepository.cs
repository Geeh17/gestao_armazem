using GestaoArmazem.Domain.Entities;

namespace GestaoArmazem.Domain.Interfaces;

public interface IUsuarioRepository
{
    Task<Usuario?> ObterPorEmailAsync(string email);
    Task<Usuario?> ObterPorIdAsync(Guid id);
    Task<IEnumerable<Usuario>> ListarAsync();
    Task<Guid> CriarAsync(Usuario usuario);
    Task AtualizarAsync(Usuario usuario);
    Task AtualizarSenhaHashAsync(Guid usuarioId, string novaSenhaHash);

    /// <summary>Indica se o usuário está referenciado em alguma movimentação de estoque (log imutável, RN02).</summary>
    Task<bool> PossuiReferenciasAsync(Guid id);
    Task ExcluirAsync(Guid id);
}
