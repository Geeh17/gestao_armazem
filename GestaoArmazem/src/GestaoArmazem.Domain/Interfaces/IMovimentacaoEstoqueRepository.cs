using GestaoArmazem.Domain.Entities;

namespace GestaoArmazem.Domain.Interfaces;

public interface IMovimentacaoEstoqueRepository
{
    Task<Guid> RegistrarAsync(MovimentacaoEstoque movimentacao);
    Task<IEnumerable<MovimentacaoEstoque>> ListarPorProdutoAsync(Guid produtoId);
}
