using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestaoArmazem.API.Controllers;

[ApiController]
[Route("api/pedidos-expedicao")]
[Authorize]
public class PedidosExpedicaoController : ControllerBase
{
    private readonly IPedidoExpedicaoService _pedidoService;

    public PedidosExpedicaoController(IPedidoExpedicaoService pedidoService)
    {
        _pedidoService = pedidoService;
    }

    /// <summary>Lista pedidos de expedição com paginação.</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PedidoExpedicaoDto>>> Listar(
        [FromQuery] int pagina = 1, [FromQuery] int tamanhoPagina = 20)
    {
        return Ok(await _pedidoService.ListarAsync(pagina, tamanhoPagina));
    }

    /// <summary>Consulta um pedido de expedição e seus itens.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PedidoExpedicaoDto>> ObterPorId(Guid id)
    {
        var pedido = await _pedidoService.ObterPorIdAsync(id);
        return pedido is null ? NotFound() : Ok(pedido);
    }

    /// <summary>Cria um novo pedido de expedição (RF08, UC06).</summary>
    [HttpPost]
    public async Task<ActionResult<PedidoExpedicaoDto>> Criar([FromBody] CriarPedidoExpedicaoDto dto)
    {
        var pedido = await _pedidoService.CriarAsync(dto);
        return CreatedAtAction(nameof(ObterPorId), new { id = pedido.Id }, pedido);
    }

    /// <summary>
    /// Expede o pedido inteiro (RN06: tudo ou nada — se faltar saldo de qualquer
    /// item, nada é baixado do estoque e o pedido continua pendente).
    /// </summary>
    [HttpPost("{id:guid}/expedir")]
    public async Task<IActionResult> Expedir(Guid id, [FromBody] ExpedirPedidoDto dto)
    {
        await _pedidoService.ExpedirAsync(id, dto);
        return NoContent();
    }
}
