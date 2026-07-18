using GestaoArmazem.Domain.Entities;

namespace GestaoArmazem.Domain.Interfaces;

public interface IPerfilRepository
{
    Task<Perfil?> ObterPorIdAsync(Guid id);
    Task<IEnumerable<Perfil>> ListarAsync();
    Task<Guid> CriarAsync(Perfil perfil);
}
