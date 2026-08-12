using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Exceptions;
using GestaoArmazem.Application.Interfaces;
using GestaoArmazem.Application.Services;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;
using Moq;
using Xunit;

namespace GestaoArmazem.Application.Tests;

public class AuthServiceTests
{
    private readonly Mock<IUsuarioRepository> _usuarioRepository = new();
    private readonly Mock<IPerfilRepository> _perfilRepository = new();
    private readonly Mock<IPasswordHasher> _passwordHasher = new();
    private readonly Mock<IJwtTokenGenerator> _tokenGenerator = new();
    private readonly Mock<IRefreshTokenRepository> _refreshTokenRepository = new();
    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        _sut = new AuthService(
            _usuarioRepository.Object, _perfilRepository.Object, _passwordHasher.Object,
            _tokenGenerator.Object, _refreshTokenRepository.Object);

        // Padrão razoável pros testes que não mexem diretamente na emissão de refresh token.
        _tokenGenerator.Setup(t => t.GerarRefreshToken())
            .Returns(("refresh-token-fake", DateTime.UtcNow.AddDays(7)));
    }

    [Fact]
    public async Task LoginAsync_ComEmailInexistente_DeveLancarCredenciaisInvalidas()
    {
        _usuarioRepository.Setup(r => r.ObterPorEmailAsync(It.IsAny<string>())).ReturnsAsync((Usuario?)null);

        await Assert.ThrowsAsync<CredenciaisInvalidasException>(
            () => _sut.LoginAsync(new LoginDto("naoexiste@teste.com", "qualquer")));

        _tokenGenerator.Verify(t => t.GerarToken(It.IsAny<Usuario>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task LoginAsync_ComSenhaIncorreta_DeveLancarCredenciaisInvalidas()
    {
        var usuario = new Usuario { Id = Guid.NewGuid(), Email = "user@teste.com", SenhaHash = "hash-armazenado" };
        _usuarioRepository.Setup(r => r.ObterPorEmailAsync(usuario.Email)).ReturnsAsync(usuario);
        _passwordHasher.Setup(p => p.Verificar("senha-errada", usuario.SenhaHash)).Returns(false);

        await Assert.ThrowsAsync<CredenciaisInvalidasException>(
            () => _sut.LoginAsync(new LoginDto(usuario.Email, "senha-errada")));
    }

    [Fact]
    public async Task LoginAsync_ComCredenciaisValidas_DeveRetornarTokenERefreshToken()
    {
        var usuario = new Usuario
        {
            Id = Guid.NewGuid(), Email = "user@teste.com", SenhaHash = "hash-armazenado", PerfilId = Guid.NewGuid()
        };
        var perfil = new Perfil { Id = usuario.PerfilId, Nome = "Administrador" };
        var expiraEm = DateTime.UtcNow.AddMinutes(60);

        _usuarioRepository.Setup(r => r.ObterPorEmailAsync(usuario.Email)).ReturnsAsync(usuario);
        _passwordHasher.Setup(p => p.Verificar("senha-correta", usuario.SenhaHash)).Returns(true);
        _perfilRepository.Setup(r => r.ObterPorIdAsync(usuario.PerfilId)).ReturnsAsync(perfil);
        _tokenGenerator.Setup(t => t.GerarToken(usuario, perfil.Nome)).Returns(("token-jwt-fake", expiraEm));

        var resultado = await _sut.LoginAsync(new LoginDto(usuario.Email, "senha-correta"));

        Assert.Equal("token-jwt-fake", resultado.Token);
        Assert.Equal(expiraEm, resultado.ExpiraEm);
        Assert.Equal("refresh-token-fake", resultado.RefreshToken);
        _refreshTokenRepository.Verify(
            r => r.CriarAsync(It.Is<RefreshToken>(rt => rt.UsuarioId == usuario.Id && rt.Token == "refresh-token-fake")),
            Times.Once);
    }

    [Fact]
    public async Task RefreshAsync_ComTokenInexistente_DeveLancarRefreshTokenInvalido()
    {
        _refreshTokenRepository.Setup(r => r.ObterPorTokenAsync("token-desconhecido")).ReturnsAsync((RefreshToken?)null);

        await Assert.ThrowsAsync<RefreshTokenInvalidoException>(
            () => _sut.RefreshAsync(new RefreshTokenRequestDto("token-desconhecido")));
    }

    [Fact]
    public async Task RefreshAsync_ComTokenRevogado_DeveLancarRefreshTokenInvalido()
    {
        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(), UsuarioId = Guid.NewGuid(), Token = "token-usado",
            Revogado = true, ExpiraEm = DateTime.UtcNow.AddDays(3)
        };
        _refreshTokenRepository.Setup(r => r.ObterPorTokenAsync("token-usado")).ReturnsAsync(refreshToken);

        await Assert.ThrowsAsync<RefreshTokenInvalidoException>(
            () => _sut.RefreshAsync(new RefreshTokenRequestDto("token-usado")));

        _refreshTokenRepository.Verify(r => r.RevogarAsync(It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task RefreshAsync_ComTokenExpirado_DeveLancarRefreshTokenInvalido()
    {
        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(), UsuarioId = Guid.NewGuid(), Token = "token-expirado",
            Revogado = false, ExpiraEm = DateTime.UtcNow.AddDays(-1)
        };
        _refreshTokenRepository.Setup(r => r.ObterPorTokenAsync("token-expirado")).ReturnsAsync(refreshToken);

        await Assert.ThrowsAsync<RefreshTokenInvalidoException>(
            () => _sut.RefreshAsync(new RefreshTokenRequestDto("token-expirado")));
    }

    [Fact]
    public async Task RefreshAsync_ComTokenValido_DeveRotacionar_RevogaOAntigoEEmiteNovo()
    {
        var usuario = new Usuario { Id = Guid.NewGuid(), PerfilId = Guid.NewGuid() };
        var perfil = new Perfil { Id = usuario.PerfilId, Nome = "Gestor de Estoque" };
        var refreshTokenAntigo = new RefreshToken
        {
            Id = Guid.NewGuid(), UsuarioId = usuario.Id, Token = "token-valido",
            Revogado = false, ExpiraEm = DateTime.UtcNow.AddDays(3)
        };

        _refreshTokenRepository.Setup(r => r.ObterPorTokenAsync("token-valido")).ReturnsAsync(refreshTokenAntigo);
        _usuarioRepository.Setup(r => r.ObterPorIdAsync(usuario.Id)).ReturnsAsync(usuario);
        _perfilRepository.Setup(r => r.ObterPorIdAsync(usuario.PerfilId)).ReturnsAsync(perfil);
        _tokenGenerator.Setup(t => t.GerarToken(usuario, perfil.Nome))
            .Returns(("novo-access-token", DateTime.UtcNow.AddMinutes(60)));

        var resultado = await _sut.RefreshAsync(new RefreshTokenRequestDto("token-valido"));

        Assert.Equal("novo-access-token", resultado.Token);
        Assert.Equal("refresh-token-fake", resultado.RefreshToken);
        _refreshTokenRepository.Verify(r => r.RevogarAsync(refreshTokenAntigo.Id), Times.Once);
        _refreshTokenRepository.Verify(
            r => r.CriarAsync(It.Is<RefreshToken>(rt => rt.UsuarioId == usuario.Id)), Times.Once);
    }

    [Fact]
    public async Task LogoutAsync_ComTokenValido_DeveRevogar()
    {
        var refreshToken = new RefreshToken { Id = Guid.NewGuid(), Token = "token-ativo", Revogado = false };
        _refreshTokenRepository.Setup(r => r.ObterPorTokenAsync("token-ativo")).ReturnsAsync(refreshToken);

        await _sut.LogoutAsync(new RefreshTokenRequestDto("token-ativo"));

        _refreshTokenRepository.Verify(r => r.RevogarAsync(refreshToken.Id), Times.Once);
    }

    [Fact]
    public async Task LogoutAsync_ComTokenInexistente_NaoDeveLancarErro_EhIdempotente()
    {
        _refreshTokenRepository.Setup(r => r.ObterPorTokenAsync("token-desconhecido")).ReturnsAsync((RefreshToken?)null);

        await _sut.LogoutAsync(new RefreshTokenRequestDto("token-desconhecido"));

        _refreshTokenRepository.Verify(r => r.RevogarAsync(It.IsAny<Guid>()), Times.Never);
    }
}
