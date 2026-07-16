using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestaoArmazem.API.Controllers;

[ApiController]
[Route("api/produtos")]
[Authorize]
public class ProdutosController : ControllerBase
{
    private readonly IProdutoService _produtoService;

    public ProdutosController(IProdutoService produtoService)
    {
        _produtoService = produtoService;
    }

    /// <summary>Lista produtos com paginação (RF01).</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProdutoDto>>> Listar(
        [FromQuery] int pagina = 1, [FromQuery] int tamanhoPagina = 20)
    {
        var produtos = await _produtoService.ListarAsync(pagina, tamanhoPagina);
        return Ok(produtos);
    }

    /// <summary>Consulta um produto pelo Id.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProdutoDto>> ObterPorId(Guid id)
    {
        var produto = await _produtoService.ObterPorIdAsync(id);
        return produto is null ? NotFound() : Ok(produto);
    }

    /// <summary>Cadastra um novo produto (RF01, RN03).</summary>
    [HttpPost]
    public async Task<ActionResult<ProdutoDto>> Criar([FromBody] CriarProdutoDto dto)
    {
        var produto = await _produtoService.CriarAsync(dto);
        return CreatedAtAction(nameof(ObterPorId), new { id = produto.Id }, produto);
    }
}
