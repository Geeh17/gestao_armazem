using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Interfaces;
using GestaoArmazem.Domain.Interfaces;

namespace GestaoArmazem.Application.Services;

public class EstoqueService : IEstoqueService
{
    private readonly IEstoqueRepository _estoqueRepository;

    public EstoqueService(IEstoqueRepository estoqueRepository)
    {
        _estoqueRepository = estoqueRepository;
    }

    public async Task<IEnumerable<EstoqueDto>> ConsultarPorProdutoAsync(Guid produtoId)
    {
        var registros = await _estoqueRepository.ConsultarPorProdutoAsync(produtoId);
        return registros.Select(e => new EstoqueDto(e.ProdutoId, e.LocalizacaoId, e.Quantidade));
    }
}
