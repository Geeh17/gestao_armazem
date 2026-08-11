using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestaoArmazem.API.Controllers;

[ApiController]
[Route("api/categorias")]
[Authorize]
public class CategoriasController : ControllerBase
{
    private readonly ICategoriaService _categoriaService;

    public CategoriasController(ICategoriaService categoriaService)
    {
        _categoriaService = categoriaService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoriaDto>>> Listar()
    {
        return Ok(await _categoriaService.ListarAsync());
    }

    [HttpPost]
    public async Task<ActionResult<CategoriaDto>> Criar([FromBody] CriarCategoriaDto dto)
    {
        var categoria = await _categoriaService.CriarAsync(dto);
        return CreatedAtAction(nameof(Listar), categoria);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CategoriaDto>> Atualizar(Guid id, [FromBody] AtualizarCategoriaDto dto)
    {
        return Ok(await _categoriaService.AtualizarAsync(id, dto));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        await _categoriaService.ExcluirAsync(id);
        return NoContent();
    }
}
