using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Exceptions;
using GestaoArmazem.Application.Services;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;
using Moq;
using Xunit;

namespace GestaoArmazem.Application.Tests;

public class CategoriaServiceTests
{
    private readonly Mock<ICategoriaRepository> _categoriaRepository = new();
    private readonly CategoriaService _sut;

    public CategoriaServiceTests()
    {
        _sut = new CategoriaService(_categoriaRepository.Object);
    }

    [Fact]
    public async Task CriarAsync_ComNomeValido_DeveCriarCategoria()
    {
        var dto = new CriarCategoriaDto("Ferramentas");

        var resultado = await _sut.CriarAsync(dto);

        Assert.Equal("Ferramentas", resultado.Nome);
        _categoriaRepository.Verify(r => r.CriarAsync(It.IsAny<Categoria>()), Times.Once);
    }

    [Fact]
    public async Task AtualizarAsync_ComCategoriaInexistente_DeveLancarNotFoundException()
    {
        var id = Guid.NewGuid();
        _categoriaRepository.Setup(r => r.ObterPorIdAsync(id)).ReturnsAsync((Categoria?)null);

        await Assert.ThrowsAsync<NotFoundException>(() => _sut.AtualizarAsync(id, new AtualizarCategoriaDto("X")));
    }

    [Fact]
    public async Task AtualizarAsync_ComCategoriaExistente_DeveAtualizarNome()
    {
        var id = Guid.NewGuid();
        _categoriaRepository.Setup(r => r.ObterPorIdAsync(id)).ReturnsAsync(new Categoria { Id = id, Nome = "Antigo" });

        var resultado = await _sut.AtualizarAsync(id, new AtualizarCategoriaDto("Novo Nome"));

        Assert.Equal("Novo Nome", resultado.Nome);
        _categoriaRepository.Verify(r => r.AtualizarAsync(It.Is<Categoria>(c => c.Nome == "Novo Nome")), Times.Once);
    }

    [Fact]
    public async Task ExcluirAsync_ComProdutosAssociados_DeveLancarInvalidOperationException()
    {
        var id = Guid.NewGuid();
        _categoriaRepository.Setup(r => r.ObterPorIdAsync(id)).ReturnsAsync(new Categoria { Id = id, Nome = "Eletrônicos" });
        _categoriaRepository.Setup(r => r.PossuiReferenciasAsync(id)).ReturnsAsync(true);

        await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.ExcluirAsync(id));

        _categoriaRepository.Verify(r => r.ExcluirAsync(It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task ExcluirAsync_SemProdutosAssociados_DeveExcluir()
    {
        var id = Guid.NewGuid();
        _categoriaRepository.Setup(r => r.ObterPorIdAsync(id)).ReturnsAsync(new Categoria { Id = id, Nome = "Embalagens" });
        _categoriaRepository.Setup(r => r.PossuiReferenciasAsync(id)).ReturnsAsync(false);

        await _sut.ExcluirAsync(id);

        _categoriaRepository.Verify(r => r.ExcluirAsync(id), Times.Once);
    }
}
