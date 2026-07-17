using GestaoArmazem.Application.Services;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Enums;
using GestaoArmazem.Domain.Interfaces;
using Moq;
using Xunit;

namespace GestaoArmazem.Application.Tests;

public class RelatorioServiceTests
{
    private readonly Mock<IRelatorioRepository> _relatorioRepository = new();
    private readonly RelatorioService _sut;

    public RelatorioServiceTests()
    {
        _sut = new RelatorioService(_relatorioRepository.Object);
    }

    [Fact]
    public async Task ListarProdutosComEstoqueBaixoAsync_DeveMapearParaDto()
    {
        var produtoId = Guid.NewGuid();
        _relatorioRepository
            .Setup(r => r.ListarProdutosComEstoqueBaixoAsync())
            .ReturnsAsync(new[] { new EstoqueBaixoResumo(produtoId, "SKU-1", "Produto 1", 2, 10) });

        var resultado = (await _sut.ListarProdutosComEstoqueBaixoAsync()).ToList();

        Assert.Single(resultado);
        Assert.Equal(produtoId, resultado[0].ProdutoId);
        Assert.Equal(2, resultado[0].SaldoTotal);
        Assert.Equal(10, resultado[0].EstoqueMinimo);
    }

    [Fact]
    public async Task ListarMovimentacoesAsync_ComTipoValido_DeveConverterParaEnumNoFiltro()
    {
        FiltroMovimentacoes? filtroCapturado = null;
        _relatorioRepository
            .Setup(r => r.ListarMovimentacoesAsync(It.IsAny<FiltroMovimentacoes>()))
            .Callback<FiltroMovimentacoes>(f => filtroCapturado = f)
            .ReturnsAsync(Array.Empty<MovimentacaoEstoque>());

        await _sut.ListarMovimentacoesAsync(null, "Entrada", null, null, 1, 50);

        Assert.Equal(TipoMovimentacao.Entrada, filtroCapturado?.Tipo);
    }

    [Fact]
    public async Task ListarMovimentacoesAsync_ComTipoInvalido_DeveIgnorarFiltroDeTipo()
    {
        FiltroMovimentacoes? filtroCapturado = null;
        _relatorioRepository
            .Setup(r => r.ListarMovimentacoesAsync(It.IsAny<FiltroMovimentacoes>()))
            .Callback<FiltroMovimentacoes>(f => filtroCapturado = f)
            .ReturnsAsync(Array.Empty<MovimentacaoEstoque>());

        await _sut.ListarMovimentacoesAsync(null, "tipo-que-nao-existe", null, null, 1, 50);

        Assert.Null(filtroCapturado?.Tipo);
    }
}
