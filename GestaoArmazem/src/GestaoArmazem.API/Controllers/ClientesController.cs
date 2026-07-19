using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestaoArmazem.API.Controllers;

[ApiController]
[Route("api/clientes")]
[Authorize]
public class ClientesController : ControllerBase
{
    private readonly IClienteService _clienteService;

    public ClientesController(IClienteService clienteService)
    {
        _clienteService = clienteService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClienteDto>>> Listar()
    {
        return Ok(await _clienteService.ListarAsync());
    }

    [HttpPost]
    public async Task<ActionResult<ClienteDto>> Criar([FromBody] CriarClienteDto dto)
    {
        var cliente = await _clienteService.CriarAsync(dto);
        return CreatedAtAction(nameof(Listar), cliente);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ClienteDto>> Atualizar(Guid id, [FromBody] AtualizarClienteDto dto)
    {
        return Ok(await _clienteService.AtualizarAsync(id, dto));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        await _clienteService.ExcluirAsync(id);
        return NoContent();
    }
}
