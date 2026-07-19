using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Interfaces;
using GestaoArmazem.Application.Services;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Enums;
using GestaoArmazem.Domain.Interfaces;
using Moq;
using Xunit;

namespace GestaoArmazem.Application.Tests;

public class PedidoRecebimentoServiceTests
{
    private readonly Mock<IPedidoRecebimentoRepository> _pedidoRepository = new();
    private readonly Mock<IMovimentacaoService> _movimentacaoService = new();
    private readonly PedidoRecebimentoService _sut;

    public PedidoRecebimentoServiceTests()
    {
        _sut = new PedidoRecebimentoService(_pedidoRepository.Object, _movimentacaoService.Object);
    }

    [Fact]
    public async Task CriarAsync_SemItens_DeveLancarInvalidOperationException()
    {
        var dto = new CriarPedidoRecebimentoDto(Guid.NewGuid(), DateTime.UtcNow, new List<ItemPedidoRecebimentoInputDto>());

        await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.CriarAsync(dto));

        _pedidoRepository.Verify(r => r.CriarAsync(It.IsAny<PedidoRecebimento>(), It.IsAny<IEnumerable<ItemPedidoRecebimento>>()), Times.Never);
    }

    [Fact]
    public async Task CriarAsync_ComItens_DeveCriarPedidoPendente()
    {
        var dto = new CriarPedidoRecebimentoDto(
            Guid.NewGuid(), DateTime.UtcNow,
            new List<ItemPedidoRecebimentoInputDto> { new(Guid.NewGuid(), 10) });

        var resultado = await _sut.CriarAsync(dto);

        Assert.Equal(StatusPedido.Pendente.ToString(), resultado.Status);
        Assert.Single(resultado.Itens);
        _pedidoRepository.Verify(r => r.CriarAsync(It.IsAny<PedidoRecebimento>(), It.IsAny<IEnumerable<ItemPedidoRecebimento>>()), Times.Once);
    }

    [Fact]
    public async Task ConfirmarRecebimentoItemAsync_PedidoJaConcluido_DeveLancarInvalidOperationException()
    {
        var pedidoId = Guid.NewGuid();
        var pedido = new PedidoRecebimento { Id = pedidoId, Status = StatusPedido.Concluido };
        _pedidoRepository.Setup(r => r.ObterPorIdAsync(pedidoId)).ReturnsAsync(pedido);

        var dto = new ConfirmarRecebimentoItemDto(5, Guid.NewGuid(), Guid.NewGuid());

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _sut.ConfirmarRecebimentoItemAsync(pedidoId, Guid.NewGuid(), dto));

        _movimentacaoService.Verify(m => m.RegistrarEntradaAsync(It.IsAny<MovimentacaoEntradaDto>()), Times.Never);
    }

    [Fact]
    public async Task ConfirmarRecebimentoItemAsync_RecebimentoParcial_DeveManterEmAndamento()
    {
        // RN05: só encerra quando TODOS os itens estiverem completos.
        var pedidoId = Guid.NewGuid();
        var itemId = Guid.NewGuid();
        var produtoId = Guid.NewGuid();

        var pedido = new PedidoRecebimento { Id = pedidoId, Status = StatusPedido.Pendente };
        var item = new ItemPedidoRecebimento
        {
            Id = itemId, PedidoRecebimentoId = pedidoId, ProdutoId = produtoId,
            QuantidadeEsperada = 10, QuantidadeRecebida = 0
        };

        _pedidoRepository.Setup(r => r.ObterPorIdAsync(pedidoId)).ReturnsAsync(pedido);
        _pedidoRepository.Setup(r => r.ObterItemPorIdAsync(itemId)).ReturnsAsync(item);
        _pedidoRepository.Setup(r => r.ObterItensAsync(pedidoId)).ReturnsAsync(new[] { item });

        var dto = new ConfirmarRecebimentoItemDto(4, Guid.NewGuid(), Guid.NewGuid());

        await _sut.ConfirmarRecebimentoItemAsync(pedidoId, itemId, dto);

        _movimentacaoService.Verify(m => m.RegistrarEntradaAsync(It.Is<MovimentacaoEntradaDto>(
            e => e.ProdutoId == produtoId && e.Quantidade == 4)), Times.Once);
        _pedidoRepository.Verify(r => r.AtualizarQuantidadeRecebidaAsync(itemId, 4), Times.Once);
        _pedidoRepository.Verify(r => r.AtualizarStatusAsync(pedidoId, StatusPedido.EmAndamento, null), Times.Once);
        _pedidoRepository.Verify(r => r.AtualizarStatusAsync(pedidoId, StatusPedido.Concluido, It.IsAny<DateTime?>()), Times.Never);
    }

    [Fact]
    public async Task ConfirmarRecebimentoItemAsync_UltimoItemCompleto_DeveEncerrarPedido()
    {
        var pedidoId = Guid.NewGuid();
        var itemId = Guid.NewGuid();
        var produtoId = Guid.NewGuid();

        var pedido = new PedidoRecebimento { Id = pedidoId, Status = StatusPedido.EmAndamento };
        var item = new ItemPedidoRecebimento
        {
            Id = itemId, PedidoRecebimentoId = pedidoId, ProdutoId = produtoId,
            QuantidadeEsperada = 10, QuantidadeRecebida = 6
        };

        _pedidoRepository.Setup(r => r.ObterPorIdAsync(pedidoId)).ReturnsAsync(pedido);
        _pedidoRepository.Setup(r => r.ObterItemPorIdAsync(itemId)).ReturnsAsync(item);
        _pedidoRepository.Setup(r => r.ObterItensAsync(pedidoId)).ReturnsAsync(new[] { item });

        var dto = new ConfirmarRecebimentoItemDto(4, Guid.NewGuid(), Guid.NewGuid());

        await _sut.ConfirmarRecebimentoItemAsync(pedidoId, itemId, dto);

        _pedidoRepository.Verify(r => r.AtualizarQuantidadeRecebidaAsync(itemId, 10), Times.Once);
        _pedidoRepository.Verify(r => r.AtualizarStatusAsync(pedidoId, StatusPedido.Concluido, It.IsAny<DateTime?>()), Times.Once);
    }

    [Fact]
    public async Task CancelarAsync_PedidoPendente_DeveCancelar()
    {
        var pedidoId = Guid.NewGuid();
        _pedidoRepository.Setup(r => r.ObterPorIdAsync(pedidoId))
            .ReturnsAsync(new PedidoRecebimento { Id = pedidoId, Status = StatusPedido.Pendente });

        await _sut.CancelarAsync(pedidoId);

        _pedidoRepository.Verify(r => r.AtualizarStatusAsync(pedidoId, StatusPedido.Cancelado, null), Times.Once);
    }

    [Fact]
    public async Task CancelarAsync_PedidoJaConcluido_DeveLancarInvalidOperationException()
    {
        var pedidoId = Guid.NewGuid();
        _pedidoRepository.Setup(r => r.ObterPorIdAsync(pedidoId))
            .ReturnsAsync(new PedidoRecebimento { Id = pedidoId, Status = StatusPedido.Concluido });

        await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.CancelarAsync(pedidoId));

        _pedidoRepository.Verify(r => r.AtualizarStatusAsync(It.IsAny<Guid>(), It.IsAny<StatusPedido>(), It.IsAny<DateTime?>()), Times.Never);
    }
}
