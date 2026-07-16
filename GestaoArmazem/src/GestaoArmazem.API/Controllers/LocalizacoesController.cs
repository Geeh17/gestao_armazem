using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestaoArmazem.API.Controllers;

[ApiController]
[Route("api/localizacoes")]
[Authorize]
public class LocalizacoesController : ControllerBase
{
    private readonly ILocalizacaoService _localizacaoService;

    public LocalizacoesController(ILocalizacaoService localizacaoService)
    {
        _localizacaoService = localizacaoService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LocalizacaoDto>>> Listar()
    {
        return Ok(await _localizacaoService.ListarAsync());
    }
}
