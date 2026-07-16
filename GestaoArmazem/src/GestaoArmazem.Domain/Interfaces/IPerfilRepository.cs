using GestaoArmazem.Domain.Entities;

namespace GestaoArmazem.Domain.Interfaces;

public interface IPerfilRepository
{
    Task<Perfil?> ObterPorIdAsync(Guid id);
}
