using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Exceptions;
using GestaoArmazem.Application.Services;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Enums;
using GestaoArmazem.Domain.Interfaces;
using Moq;
using Xunit;

namespace GestaoArmazem.Application.Tests;

public class MovimentacaoServiceTests
{
    private readonly Mock<IEstoqueRepository> _estoqueRepository = new();
    private readonly Mock<IMovimentacaoEstoqueRepository> _movimentacaoRepository = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();
    private readonly MovimentacaoService _sut;

    public MovimentacaoServiceTests()
    {
        _sut = new MovimentacaoService(_estoqueRepository.Object, _movimentacaoRepository.Object, _unitOfWork.Object);
    }

    [Fact]
    public async Task RegistrarEntradaAsync_DeveIncrementarSaldoERegistrarMovimentacao()
    {
        var dto = new MovimentacaoEntradaDto(Guid.NewGuid(), Guid.NewGuid(), 10, Guid.NewGuid());

        await _sut.RegistrarEntradaAsync(dto);

        _estoqueRepository.Verify(r => r.IncrementarAsync(dto.ProdutoId, dto.LocalizacaoId, dto.Quantidade), Times.Once);
        _movimentacaoRepository.Verify(r => r.RegistrarAsync(It.IsAny<Domain.Entities.MovimentacaoEstoque>()), Times.Once);
        _unitOfWork.Verify(u => u.ConfirmarAsync(), Times.Once);
        _unitOfWork.Verify(u => u.DesfazerAsync(), Times.Never);
    }

    [Fact]
    public async Task RegistrarSaidaAsync_ComSaldoInsuficiente_DeveLancarExcecaoEDesfazerTransacao()
    {
        // RN01: saída não pode resultar em saldo negativo.
        var dto = new MovimentacaoSaidaDto(Guid.NewGuid(), Guid.NewGuid(), 50, Guid.NewGuid());
        _estoqueRepository
            .Setup(r => r.TentarDecrementarAsync(dto.ProdutoId, dto.LocalizacaoId, dto.Quantidade))
            .ReturnsAsync(false);

        await Assert.ThrowsAsync<SaldoInsuficienteException>(() => _sut.RegistrarSaidaAsync(dto));

        _movimentacaoRepository.Verify(r => r.RegistrarAsync(It.IsAny<Domain.Entities.MovimentacaoEstoque>()), Times.Never);
        _unitOfWork.Verify(u => u.DesfazerAsync(), Times.Once);
        _unitOfWork.Verify(u => u.ConfirmarAsync(), Times.Never);
    }

    [Fact]
    public async Task RegistrarSaidaAsync_ComSaldoSuficiente_DeveConfirmarTransacao()
    {
        var dto = new MovimentacaoSaidaDto(Guid.NewGuid(), Guid.NewGuid(), 5, Guid.NewGuid());
        _estoqueRepository
            .Setup(r => r.TentarDecrementarAsync(dto.ProdutoId, dto.LocalizacaoId, dto.Quantidade))
            .ReturnsAsync(true);

        await _sut.RegistrarSaidaAsync(dto);

        _unitOfWork.Verify(u => u.ConfirmarAsync(), Times.Once);
    }

    [Fact]
    public async Task RegistrarTransferenciaAsync_ComSaldoSuficiente_DeveDebitarOrigemECreditarDestino()
    {
        // RN08: débito na origem e crédito no destino na mesma transação.
        var dto = new MovimentacaoTransferenciaDto(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), 10, Guid.NewGuid());
        _estoqueRepository
            .Setup(r => r.TentarDecrementarAsync(dto.ProdutoId, dto.LocalizacaoOrigemId, dto.Quantidade))
            .ReturnsAsync(true);

        await _sut.RegistrarTransferenciaAsync(dto);

        _estoqueRepository.Verify(r => r.TentarDecrementarAsync(dto.ProdutoId, dto.LocalizacaoOrigemId, dto.Quantidade), Times.Once);
        _estoqueRepository.Verify(r => r.IncrementarAsync(dto.ProdutoId, dto.LocalizacaoDestinoId, dto.Quantidade), Times.Once);
        _movimentacaoRepository.Verify(r => r.RegistrarAsync(It.IsAny<Domain.Entities.MovimentacaoEstoque>()), Times.Once);
        _unitOfWork.Verify(u => u.ConfirmarAsync(), Times.Once);
    }

    [Fact]
    public async Task RegistrarTransferenciaAsync_ComSaldoInsuficienteNaOrigem_NaoDeveCreditarDestino()
    {
        var dto = new MovimentacaoTransferenciaDto(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), 10, Guid.NewGuid());
        _estoqueRepository
            .Setup(r => r.TentarDecrementarAsync(dto.ProdutoId, dto.LocalizacaoOrigemId, dto.Quantidade))
            .ReturnsAsync(false);

        await Assert.ThrowsAsync<SaldoInsuficienteException>(() => _sut.RegistrarTransferenciaAsync(dto));

        _estoqueRepository.Verify(r => r.IncrementarAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<int>()), Times.Never);
        _unitOfWork.Verify(u => u.DesfazerAsync(), Times.Once);
    }

    [Fact]
    public async Task RegistrarAjusteAsync_ContagemMaiorQueOSaldo_DeveCreditarADiferenca()
    {
        var dto = new AjusteEstoqueDto(Guid.NewGuid(), Guid.NewGuid(), 30, Guid.NewGuid(), "Contagem de inventário");
        _estoqueRepository
            .Setup(r => r.ObterAsync(dto.ProdutoId, dto.LocalizacaoId))
            .ReturnsAsync(new Estoque { ProdutoId = dto.ProdutoId, LocalizacaoId = dto.LocalizacaoId, Quantidade = 20 });

        await _sut.RegistrarAjusteAsync(dto);

        _estoqueRepository.Verify(r => r.IncrementarAsync(dto.ProdutoId, dto.LocalizacaoId, 10), Times.Once);
        _estoqueRepository.Verify(r => r.TentarDecrementarAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<int>()), Times.Never);
        _movimentacaoRepository.Verify(
            r => r.RegistrarAsync(It.Is<Domain.Entities.MovimentacaoEstoque>(m =>
                m.Tipo == TipoMovimentacao.Ajuste && m.Quantidade == 10
                && m.LocalizacaoDestinoId == dto.LocalizacaoId && m.Motivo == "Contagem de inventário")),
            Times.Once);
        _unitOfWork.Verify(u => u.ConfirmarAsync(), Times.Once);
    }

    [Fact]
    public async Task RegistrarAjusteAsync_ContagemMenorQueOSaldo_DeveDebitarADiferenca()
    {
        var dto = new AjusteEstoqueDto(Guid.NewGuid(), Guid.NewGuid(), 5, Guid.NewGuid());
        _estoqueRepository
            .Setup(r => r.ObterAsync(dto.ProdutoId, dto.LocalizacaoId))
            .ReturnsAsync(new Estoque { ProdutoId = dto.ProdutoId, LocalizacaoId = dto.LocalizacaoId, Quantidade = 20 });
        _estoqueRepository
            .Setup(r => r.TentarDecrementarAsync(dto.ProdutoId, dto.LocalizacaoId, 15))
            .ReturnsAsync(true);

        await _sut.RegistrarAjusteAsync(dto);

        _estoqueRepository.Verify(r => r.TentarDecrementarAsync(dto.ProdutoId, dto.LocalizacaoId, 15), Times.Once);
        _movimentacaoRepository.Verify(
            r => r.RegistrarAsync(It.Is<Domain.Entities.MovimentacaoEstoque>(m =>
                m.Tipo == TipoMovimentacao.Ajuste && m.Quantidade == 15 && m.LocalizacaoOrigemId == dto.LocalizacaoId)),
            Times.Once);
    }

    [Fact]
    public async Task RegistrarAjusteAsync_ContagemIgualAoSaldo_NaoDeveMovimentarNada()
    {
        var dto = new AjusteEstoqueDto(Guid.NewGuid(), Guid.NewGuid(), 20, Guid.NewGuid());
        _estoqueRepository
            .Setup(r => r.ObterAsync(dto.ProdutoId, dto.LocalizacaoId))
            .ReturnsAsync(new Estoque { ProdutoId = dto.ProdutoId, LocalizacaoId = dto.LocalizacaoId, Quantidade = 20 });

        await _sut.RegistrarAjusteAsync(dto);

        _estoqueRepository.Verify(r => r.IncrementarAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<int>()), Times.Never);
        _estoqueRepository.Verify(r => r.TentarDecrementarAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<int>()), Times.Never);
        _movimentacaoRepository.Verify(r => r.RegistrarAsync(It.IsAny<Domain.Entities.MovimentacaoEstoque>()), Times.Never);
        _unitOfWork.Verify(u => u.ConfirmarAsync(), Times.Once);
    }

    [Fact]
    public async Task RegistrarAjusteAsync_SemSaldoAnterior_TrataComoZero()
    {
        var dto = new AjusteEstoqueDto(Guid.NewGuid(), Guid.NewGuid(), 8, Guid.NewGuid());
        _estoqueRepository
            .Setup(r => r.ObterAsync(dto.ProdutoId, dto.LocalizacaoId))
            .ReturnsAsync((Estoque?)null);

        await _sut.RegistrarAjusteAsync(dto);

        _estoqueRepository.Verify(r => r.IncrementarAsync(dto.ProdutoId, dto.LocalizacaoId, 8), Times.Once);
    }
}
