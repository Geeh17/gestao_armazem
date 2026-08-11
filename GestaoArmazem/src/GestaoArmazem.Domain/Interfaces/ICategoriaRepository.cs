using GestaoArmazem.Domain.Entities;

namespace GestaoArmazem.Domain.Interfaces;

public interface ICategoriaRepository
{
    Task<Categoria?> ObterPorIdAsync(Guid id);
    Task<IEnumerable<Categoria>> ListarAsync();
    Task<Guid> CriarAsync(Categoria categoria);
    Task AtualizarAsync(Categoria categoria);

    /// <summary>Indica se a categoria está referenciada em algum produto.</summary>
    Task<bool> PossuiReferenciasAsync(Guid id);
    Task ExcluirAsync(Guid id);
}
