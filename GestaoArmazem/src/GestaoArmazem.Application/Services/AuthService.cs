using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Exceptions;
using GestaoArmazem.Application.Interfaces;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;

namespace GestaoArmazem.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IPerfilRepository _perfilRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _tokenGenerator;
    private readonly IRefreshTokenRepository _refreshTokenRepository;

    public AuthService(
        IUsuarioRepository usuarioRepository,
        IPerfilRepository perfilRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator tokenGenerator,
        IRefreshTokenRepository refreshTokenRepository)
    {
        _usuarioRepository = usuarioRepository;
        _perfilRepository = perfilRepository;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
        _refreshTokenRepository = refreshTokenRepository;
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
        var refreshToken = await EmitirRefreshTokenAsync(usuario.Id);

        return new TokenResponseDto(token, expiraEm, refreshToken);
    }

    public async Task<TokenResponseDto> RefreshAsync(RefreshTokenRequestDto dto)
    {
        var refreshTokenAtual = await _refreshTokenRepository.ObterPorTokenAsync(dto.RefreshToken);
        if (refreshTokenAtual is null || refreshTokenAtual.Revogado || refreshTokenAtual.ExpiraEm < DateTime.UtcNow)
        {
            throw new RefreshTokenInvalidoException();
        }

        var usuario = await _usuarioRepository.ObterPorIdAsync(refreshTokenAtual.UsuarioId)
            ?? throw new RefreshTokenInvalidoException();

        var perfil = await _perfilRepository.ObterPorIdAsync(usuario.PerfilId);
        var (token, expiraEm) = _tokenGenerator.GerarToken(usuario, perfil?.Nome ?? "Sem Perfil");

        // Rotação: o refresh token usado é revogado e um novo é emitido — se um refresh
        // token roubado for usado depois do legítimo, a revogação já invalidou a sessão.
        await _refreshTokenRepository.RevogarAsync(refreshTokenAtual.Id);
        var novoRefreshToken = await EmitirRefreshTokenAsync(usuario.Id);

        return new TokenResponseDto(token, expiraEm, novoRefreshToken);
    }

    public async Task LogoutAsync(RefreshTokenRequestDto dto)
    {
        var refreshToken = await _refreshTokenRepository.ObterPorTokenAsync(dto.RefreshToken);
        if (refreshToken is null || refreshToken.Revogado)
        {
            return; // Idempotente: já deslogado, não há o que fazer nem informar.
        }

        await _refreshTokenRepository.RevogarAsync(refreshToken.Id);
    }

    private async Task<string> EmitirRefreshTokenAsync(Guid usuarioId)
    {
        var (token, expiraEm) = _tokenGenerator.GerarRefreshToken();

        await _refreshTokenRepository.CriarAsync(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuarioId,
            Token = token,
            ExpiraEm = expiraEm,
            Revogado = false,
            CriadoEm = DateTime.UtcNow
        });

        return token;
    }
}
