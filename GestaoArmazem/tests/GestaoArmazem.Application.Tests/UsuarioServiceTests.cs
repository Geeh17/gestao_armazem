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

    [Fact]
    public async Task AtualizarAsync_ComEmailJaUsadoPorOutroUsuario_DeveLancarInvalidOperationException()
    {
        var usuarioId = Guid.NewGuid();
        var outroUsuarioId = Guid.NewGuid();
        var dto = new AtualizarUsuarioDto("Ana", "ana@teste.com", Guid.NewGuid());

        _usuarioRepository.Setup(r => r.ObterPorIdAsync(usuarioId))
            .ReturnsAsync(new Usuario { Id = usuarioId, Email = "ana.antigo@teste.com" });
        _usuarioRepository.Setup(r => r.ObterPorEmailAsync(dto.Email))
            .ReturnsAsync(new Usuario { Id = outroUsuarioId, Email = dto.Email });

        await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.AtualizarAsync(usuarioId, dto));

        _usuarioRepository.Verify(r => r.AtualizarAsync(It.IsAny<Usuario>()), Times.Never);
    }

    [Fact]
    public async Task AtualizarAsync_MantendoOProprioEmail_NaoDeveLancarErro()
    {
        var usuarioId = Guid.NewGuid();
        var perfilId = Guid.NewGuid();
        var dto = new AtualizarUsuarioDto("Ana Editada", "ana@teste.com", perfilId);

        _usuarioRepository.Setup(r => r.ObterPorIdAsync(usuarioId))
            .ReturnsAsync(new Usuario { Id = usuarioId, Email = "ana@teste.com" });
        // O próprio usuário "possui" o email — não deve ser tratado como conflito.
        _usuarioRepository.Setup(r => r.ObterPorEmailAsync(dto.Email))
            .ReturnsAsync(new Usuario { Id = usuarioId, Email = dto.Email });
        _perfilRepository.Setup(r => r.ObterPorIdAsync(perfilId)).ReturnsAsync(new Perfil { Id = perfilId, Nome = "Administrador" });

        var resultado = await _sut.AtualizarAsync(usuarioId, dto);

        Assert.Equal("Ana Editada", resultado.Nome);
        _usuarioRepository.Verify(r => r.AtualizarAsync(It.IsAny<Usuario>()), Times.Once);
    }

    [Fact]
    public async Task ExcluirAsync_ComMovimentacoesRegistradas_DeveLancarInvalidOperationException()
    {
        var usuarioId = Guid.NewGuid();
        _usuarioRepository.Setup(r => r.ObterPorIdAsync(usuarioId)).ReturnsAsync(new Usuario { Id = usuarioId });
        _usuarioRepository.Setup(r => r.PossuiReferenciasAsync(usuarioId)).ReturnsAsync(true);

        await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.ExcluirAsync(usuarioId));

        _usuarioRepository.Verify(r => r.ExcluirAsync(It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task ExcluirAsync_SemMovimentacoes_DeveExcluir()
    {
        var usuarioId = Guid.NewGuid();
        _usuarioRepository.Setup(r => r.ObterPorIdAsync(usuarioId)).ReturnsAsync(new Usuario { Id = usuarioId });
        _usuarioRepository.Setup(r => r.PossuiReferenciasAsync(usuarioId)).ReturnsAsync(false);

        await _sut.ExcluirAsync(usuarioId);

        _usuarioRepository.Verify(r => r.ExcluirAsync(usuarioId), Times.Once);
    }

    [Fact]
    public async Task ResetarSenhaAsync_NaoExigeSenhaAtual_ApenasHasheiaEAtualiza()
    {
        var usuarioId = Guid.NewGuid();
        var dto = new ResetarSenhaDto("nova-senha-provisoria");

        _usuarioRepository.Setup(r => r.ObterPorIdAsync(usuarioId)).ReturnsAsync(new Usuario { Id = usuarioId });
        _passwordHasher.Setup(h => h.Hash(dto.NovaSenha)).Returns("hash-resetado");

        await _sut.ResetarSenhaAsync(usuarioId, dto);

        _usuarioRepository.Verify(r => r.AtualizarSenhaHashAsync(usuarioId, "hash-resetado"), Times.Once);
        _passwordHasher.Verify(h => h.Verificar(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }
}
