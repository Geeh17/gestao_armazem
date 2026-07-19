using GestaoArmazem.Domain.Entities;

namespace GestaoArmazem.Domain.Interfaces;

public interface IArmazemRepository
{
    Task<Armazem?> ObterPorIdAsync(Guid id);
    Task<IEnumerable<Armazem>> ListarAsync();
    Task<Guid> CriarAsync(Armazem armazem);
    Task AtualizarAsync(Armazem armazem);

    /// <summary>Indica se o armazém possui alguma localização cadastrada.</summary>
    Task<bool> PossuiReferenciasAsync(Guid id);
    Task ExcluirAsync(Guid id);
}
