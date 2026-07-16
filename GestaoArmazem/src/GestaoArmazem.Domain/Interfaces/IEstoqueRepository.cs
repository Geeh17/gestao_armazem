using GestaoArmazem.Domain.Entities;

namespace GestaoArmazem.Domain.Interfaces;

public interface IEstoqueRepository
{
    Task<Estoque?> ObterAsync(Guid produtoId, Guid localizacaoId);
    Task<IEnumerable<Estoque>> ConsultarPorProdutoAsync(Guid produtoId);

    /// <summary>
    /// Incrementa (ou cria) o saldo de um produto em uma localização.
    /// Deve ser chamado dentro de uma transação já aberta pelo IUnitOfWork.
    /// </summary>
    Task IncrementarAsync(Guid produtoId, Guid localizacaoId, int quantidade);

    /// <summary>
    /// Decrementa o saldo de um produto em uma localização.
    /// Lança SaldoInsuficienteException (camada Application) se o saldo for menor que a quantidade (RN01).
    /// </summary>
    Task<bool> TentarDecrementarAsync(Guid produtoId, Guid localizacaoId, int quantidade);
}
