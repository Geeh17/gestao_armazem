using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestaoArmazem.API.Controllers;

[ApiController]
[Route("api/relatorios")]
[Authorize]
public class RelatoriosController : ControllerBase
{
    private readonly IRelatorioService _relatorioService;

    public RelatoriosController(IRelatorioService relatorioService)
    {
        _relatorioService = relatorioService;
    }

    /// <summary>Produtos cujo saldo total está abaixo do estoque mínimo cadastrado.</summary>
    [HttpGet("estoque-baixo")]
    public async Task<ActionResult<IEnumerable<EstoqueBaixoDto>>> EstoqueBaixo()
    {
        return Ok(await _relatorioService.ListarProdutosComEstoqueBaixoAsync());
    }

    /// <summary>Histórico de movimentações, com filtros opcionais.</summary>
    [HttpGet("movimentacoes")]
    public async Task<ActionResult<IEnumerable<MovimentacaoRelatorioDto>>> Movimentacoes(
        [FromQuery] Guid? produtoId,
        [FromQuery] string? tipo,
        [FromQuery] DateTime? dataInicio,
        [FromQuery] DateTime? dataFim,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanhoPagina = 50)
    {
        var resultado = await _relatorioService.ListarMovimentacoesAsync(
            produtoId, tipo, dataInicio, dataFim, pagina, tamanhoPagina);
        return Ok(resultado);
    }
}
