using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestaoArmazem.API.Controllers;

[ApiController]
[Route("api/fornecedores")]
[Authorize]
public class FornecedoresController : ControllerBase
{
    private readonly IFornecedorService _fornecedorService;

    public FornecedoresController(IFornecedorService fornecedorService)
    {
        _fornecedorService = fornecedorService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<FornecedorDto>>> Listar()
    {
        return Ok(await _fornecedorService.ListarAsync());
    }

    [HttpPost]
    public async Task<ActionResult<FornecedorDto>> Criar([FromBody] CriarFornecedorDto dto)
    {
        var fornecedor = await _fornecedorService.CriarAsync(dto);
        return CreatedAtAction(nameof(Listar), fornecedor);
    }
}
