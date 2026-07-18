using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestaoArmazem.API.Controllers;

/// <summary>RN07: apenas Administrador gerencia perfis e usuários.</summary>
[ApiController]
[Route("api/perfis")]
[Authorize(Roles = "Administrador")]
public class PerfisController : ControllerBase
{
    private readonly IPerfilService _perfilService;

    public PerfisController(IPerfilService perfilService)
    {
        _perfilService = perfilService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PerfilDto>>> Listar()
    {
        return Ok(await _perfilService.ListarAsync());
    }

    [HttpPost]
    public async Task<ActionResult<PerfilDto>> Criar([FromBody] CriarPerfilDto dto)
    {
        var perfil = await _perfilService.CriarAsync(dto);
        return CreatedAtAction(nameof(Listar), perfil);
    }
}
