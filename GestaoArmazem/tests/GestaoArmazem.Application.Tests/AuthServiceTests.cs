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
    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        _sut = new AuthService(
            _usuarioRepository.Object, _perfilRepository.Object, _passwordHasher.Object, _tokenGenerator.Object);
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
    public async Task LoginAsync_ComCredenciaisValidas_DeveRetornarToken()
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
    }
}
