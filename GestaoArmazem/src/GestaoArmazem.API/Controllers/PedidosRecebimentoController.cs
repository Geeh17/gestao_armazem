using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestaoArmazem.API.Controllers;

[ApiController]
[Route("api/pedidos-recebimento")]
[Authorize]
public class PedidosRecebimentoController : ControllerBase
{
    private readonly IPedidoRecebimentoService _pedidoService;

    public PedidosRecebimentoController(IPedidoRecebimentoService pedidoService)
    {
        _pedidoService = pedidoService;
    }

    /// <summary>Lista pedidos de recebimento com paginação.</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PedidoRecebimentoDto>>> Listar(
        [FromQuery] int pagina = 1, [FromQuery] int tamanhoPagina = 20)
    {
        return Ok(await _pedidoService.ListarAsync(pagina, tamanhoPagina));
    }

    /// <summary>Consulta um pedido de recebimento e seus itens.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PedidoRecebimentoDto>> ObterPorId(Guid id)
    {
        var pedido = await _pedidoService.ObterPorIdAsync(id);
        return pedido is null ? NotFound() : Ok(pedido);
    }

    /// <summary>Cria um novo pedido de recebimento (RF07, UC05).</summary>
    [HttpPost]
    public async Task<ActionResult<PedidoRecebimentoDto>> Criar([FromBody] CriarPedidoRecebimentoDto dto)
    {
        var pedido = await _pedidoService.CriarAsync(dto);
        return CreatedAtAction(nameof(ObterPorId), new { id = pedido.Id }, pedido);
    }

    /// <summary>
    /// Confirma o recebimento de um item: dá entrada no estoque e, quando todos os
    /// itens estiverem completos, encerra o pedido automaticamente (RN05).
    /// </summary>
    [HttpPost("{id:guid}/itens/{itemId:guid}/confirmar-recebimento")]
    public async Task<IActionResult> ConfirmarRecebimentoItem(
        Guid id, Guid itemId, [FromBody] ConfirmarRecebimentoItemDto dto)
    {
        await _pedidoService.ConfirmarRecebimentoItemAsync(id, itemId, dto);
        return NoContent();
    }

    /// <summary>Cancela o pedido, se ainda não estiver Concluido ou já Cancelado.</summary>
    [HttpPost("{id:guid}/cancelar")]
    public async Task<IActionResult> Cancelar(Guid id)
    {
        await _pedidoService.CancelarAsync(id);
        return NoContent();
    }
}
