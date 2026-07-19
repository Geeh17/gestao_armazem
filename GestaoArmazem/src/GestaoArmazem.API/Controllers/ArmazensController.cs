using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestaoArmazem.API.Controllers;

[ApiController]
[Route("api/armazens")]
[Authorize]
public class ArmazensController : ControllerBase
{
    private readonly IArmazemService _armazemService;

    public ArmazensController(IArmazemService armazemService)
    {
        _armazemService = armazemService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ArmazemDto>>> Listar()
    {
        return Ok(await _armazemService.ListarAsync());
    }

    [HttpPost]
    public async Task<ActionResult<ArmazemDto>> Criar([FromBody] CriarArmazemDto dto)
    {
        var armazem = await _armazemService.CriarAsync(dto);
        return CreatedAtAction(nameof(Listar), armazem);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ArmazemDto>> Atualizar(Guid id, [FromBody] AtualizarArmazemDto dto)
    {
        return Ok(await _armazemService.AtualizarAsync(id, dto));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        await _armazemService.ExcluirAsync(id);
        return NoContent();
    }
}
