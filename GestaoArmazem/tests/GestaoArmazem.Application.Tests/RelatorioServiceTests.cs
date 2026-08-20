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

    [Fact]
    public async Task ListarPedidosRecebimentoAsync_ComStatusValido_DeveConverterParaEnumNoFiltro()
    {
        FiltroPedidosRecebimento? filtroCapturado = null;
        _relatorioRepository
            .Setup(r => r.ListarPedidosRecebimentoAsync(It.IsAny<FiltroPedidosRecebimento>()))
            .Callback<FiltroPedidosRecebimento>(f => filtroCapturado = f)
            .ReturnsAsync(Array.Empty<PedidoRecebimentoResumo>());

        await _sut.ListarPedidosRecebimentoAsync(null, "Concluido", null, null, 1, 50);

        Assert.Equal(StatusPedido.Concluido, filtroCapturado?.Status);
    }

    [Fact]
    public async Task ListarPedidosRecebimentoAsync_DeveMapearFornecedorNomeEQuantidadeItens()
    {
        var pedidoId = Guid.NewGuid();
        var fornecedorId = Guid.NewGuid();
        _relatorioRepository
            .Setup(r => r.ListarPedidosRecebimentoAsync(It.IsAny<FiltroPedidosRecebimento>()))
            .ReturnsAsync(new[]
            {
                new PedidoRecebimentoResumo
                {
                    Id = pedidoId, FornecedorId = fornecedorId, FornecedorNome = "Fornecedor A",
                    Status = StatusPedido.Pendente, DataPrevista = DateTime.UtcNow,
                    DataRecebimento = null, QuantidadeItens = 3
                }
            });

        var resultado = (await _sut.ListarPedidosRecebimentoAsync(null, null, null, null, 1, 50)).ToList();

        Assert.Single(resultado);
        Assert.Equal("Fornecedor A", resultado[0].FornecedorNome);
        Assert.Equal("Pendente", resultado[0].Status);
        Assert.Equal(3, resultado[0].QuantidadeItens);
    }

    [Fact]
    public async Task ListarPedidosExpedicaoAsync_ComStatusInvalido_DeveIgnorarFiltroDeStatus()
    {
        FiltroPedidosExpedicao? filtroCapturado = null;
        _relatorioRepository
            .Setup(r => r.ListarPedidosExpedicaoAsync(It.IsAny<FiltroPedidosExpedicao>()))
            .Callback<FiltroPedidosExpedicao>(f => filtroCapturado = f)
            .ReturnsAsync(Array.Empty<PedidoExpedicaoResumo>());

        await _sut.ListarPedidosExpedicaoAsync(null, "status-invalido", null, null, 1, 50);

        Assert.Null(filtroCapturado?.Status);
    }

    [Fact]
    public async Task ListarPedidosExpedicaoAsync_DeveMapearClienteNomeEQuantidadeItens()
    {
        var pedidoId = Guid.NewGuid();
        var clienteId = Guid.NewGuid();
        _relatorioRepository
            .Setup(r => r.ListarPedidosExpedicaoAsync(It.IsAny<FiltroPedidosExpedicao>()))
            .ReturnsAsync(new[]
            {
                new PedidoExpedicaoResumo
                {
                    Id = pedidoId, ClienteId = clienteId, ClienteNome = "Cliente A",
                    Status = StatusPedido.EmAndamento, DataPrevista = DateTime.UtcNow,
                    DataExpedicao = null, QuantidadeItens = 2
                }
            });

        var resultado = (await _sut.ListarPedidosExpedicaoAsync(null, null, null, null, 1, 50)).ToList();

        Assert.Single(resultado);
        Assert.Equal("Cliente A", resultado[0].ClienteNome);
        Assert.Equal("EmAndamento", resultado[0].Status);
        Assert.Equal(2, resultado[0].QuantidadeItens);
    }
}
