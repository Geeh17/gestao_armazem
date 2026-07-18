using System.IdentityModel.Tokens.Jwt;
using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestaoArmazem.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IUsuarioService _usuarioService;

    public AuthController(IAuthService authService, IUsuarioService usuarioService)
    {
        _authService = authService;
        _usuarioService = usuarioService;
    }

    /// <summary>Autentica um usuário e retorna o token JWT (RF10).</summary>
    [HttpPost("login")]
    public async Task<ActionResult<TokenResponseDto>> Login([FromBody] LoginDto dto)
    {
        var resultado = await _authService.LoginAsync(dto);
        return Ok(resultado);
    }

    /// <summary>Troca a senha do usuário logado (exige a senha atual).</summary>
    [HttpPost("alterar-senha")]
    [Authorize]
    public async Task<IActionResult> AlterarSenha([FromBody] AlterarSenhaDto dto)
    {
        var usuarioId = Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
        await _usuarioService.AlterarSenhaAsync(usuarioId, dto);
        return NoContent();
    }
}
