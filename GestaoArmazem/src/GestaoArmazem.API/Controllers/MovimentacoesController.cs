using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestaoArmazem.API.Controllers;

[ApiController]
[Route("api/movimentacoes")]
[Authorize]
public class MovimentacoesController : ControllerBase
{
    private readonly IMovimentacaoService _movimentacaoService;

    public MovimentacoesController(IMovimentacaoService movimentacaoService)
    {
        _movimentacaoService = movimentacaoService;
    }

    /// <summary>Registra entrada de produto (RF03, UC01).</summary>
    [HttpPost("entrada")]
    public async Task<IActionResult> RegistrarEntrada([FromBody] MovimentacaoEntradaDto dto)
    {
        await _movimentacaoService.RegistrarEntradaAsync(dto);
        return NoContent();
    }

    /// <summary>Registra saída de produto (RF04, UC02, RN01).</summary>
    [HttpPost("saida")]
    public async Task<IActionResult> RegistrarSaida([FromBody] MovimentacaoSaidaDto dto)
    {
        await _movimentacaoService.RegistrarSaidaAsync(dto);
        return NoContent();
    }

    /// <summary>Registra transferência entre localizações (RF05, UC03, RN08).</summary>
    [HttpPost("transferencia")]
    public async Task<IActionResult> RegistrarTransferencia([FromBody] MovimentacaoTransferenciaDto dto)
    {
        await _movimentacaoService.RegistrarTransferenciaAsync(dto);
        return NoContent();
    }
}
