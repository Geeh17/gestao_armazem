using GestaoArmazem.Domain.Entities;

namespace GestaoArmazem.Domain.Interfaces;

public interface IFornecedorRepository
{
    Task<Fornecedor?> ObterPorIdAsync(Guid id);
    Task<IEnumerable<Fornecedor>> ListarAsync();
    Task<Guid> CriarAsync(Fornecedor fornecedor);
    Task AtualizarAsync(Fornecedor fornecedor);

    /// <summary>Indica se o fornecedor está referenciado em algum pedido de recebimento.</summary>
    Task<bool> PossuiReferenciasAsync(Guid id);
    Task ExcluirAsync(Guid id);
}
