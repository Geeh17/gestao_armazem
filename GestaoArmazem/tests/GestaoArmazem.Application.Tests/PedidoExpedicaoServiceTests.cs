using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Exceptions;
using GestaoArmazem.Application.Services;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Enums;
using GestaoArmazem.Domain.Interfaces;
using Moq;
using Xunit;

namespace GestaoArmazem.Application.Tests;

public class PedidoExpedicaoServiceTests
{
    private readonly Mock<IPedidoExpedicaoRepository> _pedidoRepository = new();
    private readonly Mock<IEstoqueRepository> _estoqueRepository = new();
    private readonly Mock<IMovimentacaoEstoqueRepository> _movimentacaoRepository = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();
    private readonly PedidoExpedicaoService _sut;

    public PedidoExpedicaoServiceTests()
    {
        _sut = new PedidoExpedicaoService(
            _pedidoRepository.Object, _estoqueRepository.Object, _movimentacaoRepository.Object, _unitOfWork.Object);
    }

    [Fact]
    public async Task CriarAsync_SemItens_DeveLancarInvalidOperationException()
    {
        var dto = new CriarPedidoExpedicaoDto(Guid.NewGuid(), DateTime.UtcNow, new List<ItemPedidoExpedicaoInputDto>());

        await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.CriarAsync(dto));
    }

    [Fact]
    public async Task ExpedirAsync_ComSaldoSuficienteParaTodosOsItens_DeveBaixarTudoEEncerrarPedido()
    {
        var pedidoId = Guid.NewGuid();
        var item1 = new ItemPedidoExpedicao { Id = Guid.NewGuid(), PedidoExpedicaoId = pedidoId, ProdutoId = Guid.NewGuid(), QuantidadeSolicitada = 5, QuantidadeExpedida = 0 };
        var item2 = new ItemPedidoExpedicao { Id = Guid.NewGuid(), PedidoExpedicaoId = pedidoId, ProdutoId = Guid.NewGuid(), QuantidadeSolicitada = 3, QuantidadeExpedida = 0 };
        var pedido = new PedidoExpedicao { Id = pedidoId, Status = StatusPedido.Pendente };

        _pedidoRepository.Setup(r => r.ObterPorIdAsync(pedidoId)).ReturnsAsync(pedido);
        _pedidoRepository.Setup(r => r.ObterItensAsync(pedidoId)).ReturnsAsync(new[] { item1, item2 });
        _estoqueRepository.Setup(r => r.TentarDecrementarAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<int>())).ReturnsAsync(true);

        var dto = new ExpedirPedidoDto(
            new List<ItemExpedicaoLocalizacaoDto>
            {
                new(item1.Id, Guid.NewGuid()),
                new(item2.Id, Guid.NewGuid())
            }, Guid.NewGuid());

        await _sut.ExpedirAsync(pedidoId, dto);

        _estoqueRepository.Verify(r => r.TentarDecrementarAsync(item1.ProdutoId, It.IsAny<Guid>(), 5), Times.Once);
        _estoqueRepository.Verify(r => r.TentarDecrementarAsync(item2.ProdutoId, It.IsAny<Guid>(), 3), Times.Once);
        _pedidoRepository.Verify(r => r.AtualizarStatusAsync(pedidoId, StatusPedido.Concluido, It.IsAny<DateTime?>()), Times.Once);
        _unitOfWork.Verify(u => u.ConfirmarAsync(), Times.Once);
        _unitOfWork.Verify(u => u.DesfazerAsync(), Times.Never);
    }

    [Fact]
    public async Task ExpedirAsync_ComSaldoInsuficienteEmUmItem_NaoDeveBaixarNadaEDeveDesfazer()
    {
        // RN06: tudo ou nada. Se o segundo item não tiver saldo, o primeiro (já
        // decrementado) deve ser revertido pelo rollback da transação.
        var pedidoId = Guid.NewGuid();
        var item1 = new ItemPedidoExpedicao { Id = Guid.NewGuid(), PedidoExpedicaoId = pedidoId, ProdutoId = Guid.NewGuid(), QuantidadeSolicitada = 5, QuantidadeExpedida = 0 };
        var item2 = new ItemPedidoExpedicao { Id = Guid.NewGuid(), PedidoExpedicaoId = pedidoId, ProdutoId = Guid.NewGuid(), QuantidadeSolicitada = 100, QuantidadeExpedida = 0 };
        var pedido = new PedidoExpedicao { Id = pedidoId, Status = StatusPedido.Pendente };

        _pedidoRepository.Setup(r => r.ObterPorIdAsync(pedidoId)).ReturnsAsync(pedido);
        _pedidoRepository.Setup(r => r.ObterItensAsync(pedidoId)).ReturnsAsync(new[] { item1, item2 });
        _estoqueRepository.Setup(r => r.TentarDecrementarAsync(item1.ProdutoId, It.IsAny<Guid>(), 5)).ReturnsAsync(true);
        _estoqueRepository.Setup(r => r.TentarDecrementarAsync(item2.ProdutoId, It.IsAny<Guid>(), 100)).ReturnsAsync(false);

        var dto = new ExpedirPedidoDto(
            new List<ItemExpedicaoLocalizacaoDto>
            {
                new(item1.Id, Guid.NewGuid()),
                new(item2.Id, Guid.NewGuid())
            }, Guid.NewGuid());

        await Assert.ThrowsAsync<SaldoInsuficienteException>(() => _sut.ExpedirAsync(pedidoId, dto));

        _pedidoRepository.Verify(r => r.AtualizarStatusAsync(pedidoId, StatusPedido.Concluido, It.IsAny<DateTime?>()), Times.Never);
        _unitOfWork.Verify(u => u.DesfazerAsync(), Times.Once);
        _unitOfWork.Verify(u => u.ConfirmarAsync(), Times.Never);
    }

    [Fact]
    public async Task ExpedirAsync_PedidoJaConcluido_DeveLancarInvalidOperationException()
    {
        var pedidoId = Guid.NewGuid();
        var pedido = new PedidoExpedicao { Id = pedidoId, Status = StatusPedido.Concluido };
        _pedidoRepository.Setup(r => r.ObterPorIdAsync(pedidoId)).ReturnsAsync(pedido);

        var dto = new ExpedirPedidoDto(new List<ItemExpedicaoLocalizacaoDto>(), Guid.NewGuid());

        await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.ExpedirAsync(pedidoId, dto));

        _unitOfWork.Verify(u => u.IniciarTransacaoAsync(), Times.Never);
    }

    [Fact]
    public async Task ExpedirAsync_SemLocalizacaoParaAlgumItem_DeveLancarInvalidOperationException()
    {
        var pedidoId = Guid.NewGuid();
        var item1 = new ItemPedidoExpedicao { Id = Guid.NewGuid(), PedidoExpedicaoId = pedidoId, ProdutoId = Guid.NewGuid(), QuantidadeSolicitada = 5, QuantidadeExpedida = 0 };
        var pedido = new PedidoExpedicao { Id = pedidoId, Status = StatusPedido.Pendente };

        _pedidoRepository.Setup(r => r.ObterPorIdAsync(pedidoId)).ReturnsAsync(pedido);
        _pedidoRepository.Setup(r => r.ObterItensAsync(pedidoId)).ReturnsAsync(new[] { item1 });

        var dto = new ExpedirPedidoDto(new List<ItemExpedicaoLocalizacaoDto>(), Guid.NewGuid());

        await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.ExpedirAsync(pedidoId, dto));

        _estoqueRepository.Verify(r => r.TentarDecrementarAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<int>()), Times.Never);
    }
}
