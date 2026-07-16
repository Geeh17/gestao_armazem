using GestaoArmazem.Domain.Entities;

namespace GestaoArmazem.Domain.Interfaces;

public interface IFornecedorRepository
{
    Task<Fornecedor?> ObterPorIdAsync(Guid id);
    Task<IEnumerable<Fornecedor>> ListarAsync();
    Task<Guid> CriarAsync(Fornecedor fornecedor);
}
