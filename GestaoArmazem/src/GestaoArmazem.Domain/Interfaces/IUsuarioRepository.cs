using GestaoArmazem.Domain.Entities;

namespace GestaoArmazem.Domain.Interfaces;

public interface IUsuarioRepository
{
    Task<Usuario?> ObterPorEmailAsync(string email);
    Task<Usuario?> ObterPorIdAsync(Guid id);
    Task<IEnumerable<Usuario>> ListarAsync();
    Task<Guid> CriarAsync(Usuario usuario);
    Task AtualizarSenhaHashAsync(Guid usuarioId, string novaSenhaHash);
}
