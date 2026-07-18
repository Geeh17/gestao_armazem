using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Exceptions;
using GestaoArmazem.Application.Interfaces;
using GestaoArmazem.Application.Services;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;
using Moq;
using Xunit;

namespace GestaoArmazem.Application.Tests;

public class UsuarioServiceTests
{
    private readonly Mock<IUsuarioRepository> _usuarioRepository = new();
    private readonly Mock<IPerfilRepository> _perfilRepository = new();
    private readonly Mock<IPasswordHasher> _passwordHasher = new();
    private readonly UsuarioService _sut;

    public UsuarioServiceTests()
    {
        _sut = new UsuarioService(_usuarioRepository.Object, _perfilRepository.Object, _passwordHasher.Object);
    }

    [Fact]
    public async Task CriarAsync_ComEmailJaExistente_DeveLancarInvalidOperationException()
    {
        var dto = new CriarUsuarioDto("Novo", "existe@teste.com", "senha12345", Guid.NewGuid());
        _usuarioRepository
            .Setup(r => r.ObterPorEmailAsync(dto.Email))
            .ReturnsAsync(new Usuario { Id = Guid.NewGuid(), Email = dto.Email });

        await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.CriarAsync(dto));

        _usuarioRepository.Verify(r => r.CriarAsync(It.IsAny<Usuario>()), Times.Never);
    }

    [Fact]
    public async Task CriarAsync_ComPerfilInexistente_DeveLancarNotFoundException()
    {
        var perfilId = Guid.NewGuid();
        var dto = new CriarUsuarioDto("Novo", "novo@teste.com", "senha12345", perfilId);

        _usuarioRepository.Setup(r => r.ObterPorEmailAsync(dto.Email)).ReturnsAsync((Usuario?)null);
        _perfilRepository.Setup(r => r.ObterPorIdAsync(perfilId)).ReturnsAsync((Perfil?)null);

        await Assert.ThrowsAsync<NotFoundException>(() => _sut.CriarAsync(dto));
    }

    [Fact]
    public async Task CriarAsync_ComDadosValidos_DeveHashearSenhaECriarUsuario()
    {
        var perfilId = Guid.NewGuid();
        var dto = new CriarUsuarioDto("Novo", "novo@teste.com", "senha12345", perfilId);

        _usuarioRepository.Setup(r => r.ObterPorEmailAsync(dto.Email)).ReturnsAsync((Usuario?)null);
        _perfilRepository.Setup(r => r.ObterPorIdAsync(perfilId)).ReturnsAsync(new Perfil { Id = perfilId, Nome = "Operador de Armazem" });
        _passwordHasher.Setup(h => h.Hash(dto.Senha)).Returns("hash-fake");

        var resultado = await _sut.CriarAsync(dto);

        Assert.Equal("Operador de Armazem", resultado.PerfilNome);
        _usuarioRepository.Verify(r => r.CriarAsync(It.Is<Usuario>(u => u.SenhaHash == "hash-fake")), Times.Once);
    }

    [Fact]
    public async Task AlterarSenhaAsync_ComSenhaAtualIncorreta_DeveLancarCredenciaisInvalidas()
    {
        var usuarioId = Guid.NewGuid();
        var usuario = new Usuario { Id = usuarioId, SenhaHash = "hash-antigo" };
        var dto = new AlterarSenhaDto("senha-errada", "senha-nova-12345");

        _usuarioRepository.Setup(r => r.ObterPorIdAsync(usuarioId)).ReturnsAsync(usuario);
        _passwordHasher.Setup(h => h.Verificar(dto.SenhaAtual, usuario.SenhaHash)).Returns(false);

        await Assert.ThrowsAsync<CredenciaisInvalidasException>(() => _sut.AlterarSenhaAsync(usuarioId, dto));

        _usuarioRepository.Verify(r => r.AtualizarSenhaHashAsync(It.IsAny<Guid>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task AlterarSenhaAsync_ComSenhaAtualCorreta_DeveAtualizarHash()
    {
        var usuarioId = Guid.NewGuid();
        var usuario = new Usuario { Id = usuarioId, SenhaHash = "hash-antigo" };
        var dto = new AlterarSenhaDto("senha-correta", "senha-nova-12345");

        _usuarioRepository.Setup(r => r.ObterPorIdAsync(usuarioId)).ReturnsAsync(usuario);
        _passwordHasher.Setup(h => h.Verificar(dto.SenhaAtual, usuario.SenhaHash)).Returns(true);
        _passwordHasher.Setup(h => h.Hash(dto.NovaSenha)).Returns("hash-novo");

        await _sut.AlterarSenhaAsync(usuarioId, dto);

        _usuarioRepository.Verify(r => r.AtualizarSenhaHashAsync(usuarioId, "hash-novo"), Times.Once);
    }
}
