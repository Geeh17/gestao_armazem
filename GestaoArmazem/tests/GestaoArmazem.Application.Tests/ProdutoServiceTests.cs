using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Services;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;
using Moq;
using Xunit;

namespace GestaoArmazem.Application.Tests;

public class ProdutoServiceTests
{
    private readonly Mock<IProdutoRepository> _produtoRepository = new();
    private readonly ProdutoService _sut;

    public ProdutoServiceTests()
    {
        _sut = new ProdutoService(_produtoRepository.Object);
    }

    [Fact]
    public async Task CriarAsync_ComSkuJaExistente_DeveLancarInvalidOperationException()
    {
        // RN03: o SKU de um produto é único em todo o sistema.
        var dto = new CriarProdutoDto("SKU-001", "Produto Teste", null, Guid.NewGuid(), "UN", null, 0);
        _produtoRepository
            .Setup(r => r.ObterPorSkuAsync(dto.SKU))
            .ReturnsAsync(new Produto { Id = Guid.NewGuid(), SKU = dto.SKU });

        await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.CriarAsync(dto));

        _produtoRepository.Verify(r => r.CriarAsync(It.IsAny<Produto>()), Times.Never);
    }

    [Fact]
    public async Task CriarAsync_ComSkuInedito_DeveCriarProduto()
    {
        var dto = new CriarProdutoDto("SKU-002", "Produto Novo", "Descricao", Guid.NewGuid(), "UN", "789123", 5);
        _produtoRepository
            .Setup(r => r.ObterPorSkuAsync(dto.SKU))
            .ReturnsAsync((Produto?)null);

        var resultado = await _sut.CriarAsync(dto);

        Assert.Equal(dto.SKU, resultado.SKU);
        Assert.Equal(dto.Nome, resultado.Nome);
        _produtoRepository.Verify(r => r.CriarAsync(It.IsAny<Produto>()), Times.Once);
    }
}
