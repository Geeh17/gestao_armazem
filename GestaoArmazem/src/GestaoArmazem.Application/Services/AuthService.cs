using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Exceptions;
using GestaoArmazem.Application.Interfaces;
using GestaoArmazem.Domain.Interfaces;

namespace GestaoArmazem.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IPerfilRepository _perfilRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _tokenGenerator;

    public AuthService(
        IUsuarioRepository usuarioRepository,
        IPerfilRepository perfilRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator tokenGenerator)
    {
        _usuarioRepository = usuarioRepository;
        _perfilRepository = perfilRepository;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<TokenResponseDto> LoginAsync(LoginDto dto)
    {
        var usuario = await _usuarioRepository.ObterPorEmailAsync(dto.Email);
        if (usuario is null || !_passwordHasher.Verificar(dto.Senha, usuario.SenhaHash))
        {
            // Mensagem genérica de propósito: não revela se o e-mail existe ou não.
            throw new CredenciaisInvalidasException();
        }

        var perfil = await _perfilRepository.ObterPorIdAsync(usuario.PerfilId);
        var (token, expiraEm) = _tokenGenerator.GerarToken(usuario, perfil?.Nome ?? "Sem Perfil");

        return new TokenResponseDto(token, expiraEm);
    }
}
