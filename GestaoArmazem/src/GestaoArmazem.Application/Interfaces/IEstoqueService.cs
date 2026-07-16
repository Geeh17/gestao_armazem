using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Interfaces;

public interface IEstoqueService
{
    Task<IEnumerable<EstoqueDto>> ConsultarPorProdutoAsync(Guid produtoId);
}
