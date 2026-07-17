using GestaoArmazem.Domain.Entities;

namespace GestaoArmazem.Domain.Interfaces;

public interface IArmazemRepository
{
    Task<Armazem?> ObterPorIdAsync(Guid id);
    Task<IEnumerable<Armazem>> ListarAsync();
    Task<Guid> CriarAsync(Armazem armazem);
}
