using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Exceptions;
using GestaoArmazem.Application.Interfaces;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Enums;
using GestaoArmazem.Domain.Interfaces;

namespace GestaoArmazem.Application.Services;

/// <summary>
/// Orquestra as regras de negócio de movimentação de estoque:
/// RN01 (sem saldo negativo), RN02 (log imutável) e RN08 (transferência transacional).
/// </summary>
public class MovimentacaoService : IMovimentacaoService
{
    private readonly IEstoqueRepository _estoqueRepository;
    private readonly IMovimentacaoEstoqueRepository _movimentacaoRepository;
    private readonly IUnitOfWork _unitOfWork;

    public MovimentacaoService(
        IEstoqueRepository estoqueRepository,
        IMovimentacaoEstoqueRepository movimentacaoRepository,
        IUnitOfWork unitOfWork)
    {
        _estoqueRepository = estoqueRepository;
        _movimentacaoRepository = movimentacaoRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task RegistrarEntradaAsync(MovimentacaoEntradaDto dto)
    {
        await _unitOfWork.IniciarTransacaoAsync();
        try
        {
            await _estoqueRepository.IncrementarAsync(dto.ProdutoId, dto.LocalizacaoId, dto.Quantidade);

            await _movimentacaoRepository.RegistrarAsync(new MovimentacaoEstoque
            {
                Id = Guid.NewGuid(),
                ProdutoId = dto.ProdutoId,
                LocalizacaoDestinoId = dto.LocalizacaoId,
                Quantidade = dto.Quantidade,
                Tipo = TipoMovimentacao.Entrada,
                Data = DateTime.UtcNow,
                UsuarioId = dto.UsuarioId
            });

            await _unitOfWork.ConfirmarAsync();
        }
        catch
        {
            await _unitOfWork.DesfazerAsync();
            throw;
        }
    }

    public async Task RegistrarSaidaAsync(MovimentacaoSaidaDto dto)
    {
        await _unitOfWork.IniciarTransacaoAsync();
        try
        {
            // RN01: não pode resultar em saldo negativo.
            var sucesso = await _estoqueRepository.TentarDecrementarAsync(dto.ProdutoId, dto.LocalizacaoId, dto.Quantidade);
            if (!sucesso)
            {
                throw new SaldoInsuficienteException(dto.ProdutoId, dto.LocalizacaoId, dto.Quantidade);
            }

            await _movimentacaoRepository.RegistrarAsync(new MovimentacaoEstoque
            {
                Id = Guid.NewGuid(),
                ProdutoId = dto.ProdutoId,
                LocalizacaoOrigemId = dto.LocalizacaoId,
                Quantidade = dto.Quantidade,
                Tipo = TipoMovimentacao.Saida,
                Data = DateTime.UtcNow,
                UsuarioId = dto.UsuarioId
            });

            await _unitOfWork.ConfirmarAsync();
        }
        catch
        {
            await _unitOfWork.DesfazerAsync();
            throw;
        }
    }

    public async Task RegistrarTransferenciaAsync(MovimentacaoTransferenciaDto dto)
    {
        await _unitOfWork.IniciarTransacaoAsync();
        try
        {
            // RN08: débito na origem e crédito no destino na mesma transação.
            var sucesso = await _estoqueRepository.TentarDecrementarAsync(
                dto.ProdutoId, dto.LocalizacaoOrigemId, dto.Quantidade);

            if (!sucesso)
            {
                throw new SaldoInsuficienteException(dto.ProdutoId, dto.LocalizacaoOrigemId, dto.Quantidade);
            }

            await _estoqueRepository.IncrementarAsync(dto.ProdutoId, dto.LocalizacaoDestinoId, dto.Quantidade);

            // Uma única movimentação registra origem e destino (RN08).
            await _movimentacaoRepository.RegistrarAsync(new MovimentacaoEstoque
            {
                Id = Guid.NewGuid(),
                ProdutoId = dto.ProdutoId,
                LocalizacaoOrigemId = dto.LocalizacaoOrigemId,
                LocalizacaoDestinoId = dto.LocalizacaoDestinoId,
                Quantidade = dto.Quantidade,
                Tipo = TipoMovimentacao.Transferencia,
                Data = DateTime.UtcNow,
                UsuarioId = dto.UsuarioId
            });

            await _unitOfWork.ConfirmarAsync();
        }
        catch
        {
            await _unitOfWork.DesfazerAsync();
            throw;
        }
    }

    public async Task RegistrarAjusteAsync(AjusteEstoqueDto dto)
    {
        await _unitOfWork.IniciarTransacaoAsync();
        try
        {
            var estoqueAtual = await _estoqueRepository.ObterAsync(dto.ProdutoId, dto.LocalizacaoId);
            var saldoAtual = estoqueAtual?.Quantidade ?? 0;
            var delta = dto.QuantidadeContada - saldoAtual;

            if (delta == 0)
            {
                // Contagem bate com o saldo atual — nada a corrigir, nenhuma movimentação registrada.
                await _unitOfWork.ConfirmarAsync();
                return;
            }

            var movimentacao = new MovimentacaoEstoque
            {
                Id = Guid.NewGuid(),
                ProdutoId = dto.ProdutoId,
                Quantidade = Math.Abs(delta),
                Tipo = TipoMovimentacao.Ajuste,
                Data = DateTime.UtcNow,
                UsuarioId = dto.UsuarioId
            };

            if (delta > 0)
            {
                // Contagem física maior que o sistema — crédito, mesma semântica de uma entrada.
                await _estoqueRepository.IncrementarAsync(dto.ProdutoId, dto.LocalizacaoId, delta);
                movimentacao.LocalizacaoDestinoId = dto.LocalizacaoId;
            }
            else
            {
                // Contagem física menor que o sistema — débito, mesma semântica de uma saída.
                // Nunca falha por saldo insuficiente: |delta| <= saldoAtual por construção.
                await _estoqueRepository.TentarDecrementarAsync(dto.ProdutoId, dto.LocalizacaoId, -delta);
                movimentacao.LocalizacaoOrigemId = dto.LocalizacaoId;
            }

            await _movimentacaoRepository.RegistrarAsync(movimentacao);
            await _unitOfWork.ConfirmarAsync();
        }
        catch
        {
            await _unitOfWork.DesfazerAsync();
            throw;
        }
    }
}
