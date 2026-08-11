using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestaoArmazem.API.Controllers;

/// <summary>RN07: apenas Administrador gerencia perfis e usuários.</summary>
[ApiController]
[Route("api/usuarios")]
[Authorize(Roles = "Administrador")]
public class UsuariosController : ControllerBase
{
    private readonly IUsuarioService _usuarioService;

    public UsuariosController(IUsuarioService usuarioService)
    {
        _usuarioService = usuarioService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UsuarioDto>>> Listar()
    {
        return Ok(await _usuarioService.ListarAsync());
    }

    [HttpPost]
    public async Task<ActionResult<UsuarioDto>> Criar([FromBody] CriarUsuarioDto dto)
    {
        var usuario = await _usuarioService.CriarAsync(dto);
        return CreatedAtAction(nameof(Listar), usuario);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<UsuarioDto>> Atualizar(Guid id, [FromBody] AtualizarUsuarioDto dto)
    {
        return Ok(await _usuarioService.AtualizarAsync(id, dto));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        await _usuarioService.ExcluirAsync(id);
        return NoContent();
    }

    /// <summary>Administrador redefine a senha de outro usuário (sem exigir a senha atual).</summary>
    [HttpPost("{id:guid}/resetar-senha")]
    public async Task<IActionResult> ResetarSenha(Guid id, [FromBody] ResetarSenhaDto dto)
    {
        await _usuarioService.ResetarSenhaAsync(id, dto);
        return NoContent();
    }
}
