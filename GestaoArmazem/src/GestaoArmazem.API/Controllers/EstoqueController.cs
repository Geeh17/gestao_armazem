using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestaoArmazem.API.Controllers;

[ApiController]
[Route("api/estoque")]
[Authorize]
public class EstoqueController : ControllerBase
{
    private readonly IEstoqueService _estoqueService;

    public EstoqueController(IEstoqueService estoqueService)
    {
        _estoqueService = estoqueService;
    }

    /// <summary>Consulta o saldo de estoque de um produto por localização (RF06).</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<EstoqueDto>>> ConsultarPorProduto([FromQuery] Guid produtoId)
    {
        var saldo = await _estoqueService.ConsultarPorProdutoAsync(produtoId);
        return Ok(saldo);
    }
}
