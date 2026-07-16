using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Exceptions;
using GestaoArmazem.Application.Interfaces;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Enums;
using GestaoArmazem.Domain.Interfaces;

namespace GestaoArmazem.Application.Services;

/// <summary>
/// Orquestra a criação e expedição de pedidos de expedição.
///
/// A expedição não reaproveita IMovimentacaoService.RegistrarSaidaAsync porque essa
/// operação precisa ser atômica para TODOS os itens do pedido de uma vez (RN06:
/// "tudo ou nada" — se faltar saldo de qualquer item, nenhum item é baixado).
/// RegistrarSaidaAsync abre e confirma sua própria transação a cada chamada, o que
/// não permite compor várias baixas em uma única transação. Por isso este serviço
/// usa IEstoqueRepository e IMovimentacaoEstoqueRepository diretamente, dentro de
/// uma única transação via IUnitOfWork.
/// </summary>
public class PedidoExpedicaoService : IPedidoExpedicaoService
{
    private readonly IPedidoExpedicaoRepository _pedidoRepository;
    private readonly IEstoqueRepository _estoqueRepository;
    private readonly IMovimentacaoEstoqueRepository _movimentacaoRepository;
    private readonly IUnitOfWork _unitOfWork;

    public PedidoExpedicaoService(
        IPedidoExpedicaoRepository pedidoRepository,
        IEstoqueRepository estoqueRepository,
        IMovimentacaoEstoqueRepository movimentacaoRepository,
        IUnitOfWork unitOfWork)
    {
        _pedidoRepository = pedidoRepository;
        _estoqueRepository = estoqueRepository;
        _movimentacaoRepository = movimentacaoRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<PedidoExpedicaoDto> CriarAsync(CriarPedidoExpedicaoDto dto)
    {
        if (dto.Itens is null || dto.Itens.Count == 0)
        {
            throw new InvalidOperationException("O pedido de expedição deve conter ao menos um item.");
        }

        var pedido = new PedidoExpedicao
        {
            Id = Guid.NewGuid(),
            ClienteId = dto.ClienteId,
            Status = StatusPedido.Pendente,
            DataPrevista = dto.DataPrevista
        };

        var itens = dto.Itens.Select(i => new ItemPedidoExpedicao
        {
            Id = Guid.NewGuid(),
            PedidoExpedicaoId = pedido.Id,
            ProdutoId = i.ProdutoId,
            QuantidadeSolicitada = i.QuantidadeSolicitada,
            QuantidadeExpedida = 0
        }).ToList();

        await _pedidoRepository.CriarAsync(pedido, itens);

        return ToDto(pedido, itens);
    }

    public async Task<PedidoExpedicaoDto?> ObterPorIdAsync(Guid id)
    {
        var pedido = await _pedidoRepository.ObterPorIdAsync(id);
        if (pedido is null) return null;

        var itens = await _pedidoRepository.ObterItensAsync(id);
        return ToDto(pedido, itens);
    }

    public async Task<IEnumerable<PedidoExpedicaoDto>> ListarAsync(int pagina, int tamanhoPagina)
    {
        var pedidos = await _pedidoRepository.ListarAsync(pagina, tamanhoPagina);

        var resultado = new List<PedidoExpedicaoDto>();
        foreach (var pedido in pedidos)
        {
            var itens = await _pedidoRepository.ObterItensAsync(pedido.Id);
            resultado.Add(ToDto(pedido, itens));
        }
        return resultado;
    }

    public async Task ExpedirAsync(Guid pedidoId, ExpedirPedidoDto dto)
    {
        var pedido = await _pedidoRepository.ObterPorIdAsync(pedidoId)
            ?? throw new NotFoundException("Pedido de expedição", pedidoId);

        if (pedido.Status is StatusPedido.Concluido or StatusPedido.Cancelado)
        {
            throw new InvalidOperationException(
                $"O pedido {pedidoId} já está {pedido.Status} e não pode ser expedido novamente.");
        }

        var itens = (await _pedidoRepository.ObterItensAsync(pedidoId)).ToList();
        if (itens.Count == 0)
        {
            throw new InvalidOperationException($"O pedido {pedidoId} não possui itens.");
        }

        var localizacaoPorItem = dto.Itens.ToDictionary(i => i.ItemId, i => i.LocalizacaoId);
        foreach (var item in itens)
        {
            if (!localizacaoPorItem.ContainsKey(item.Id))
            {
                throw new InvalidOperationException(
                    $"Nenhuma localização informada para o item {item.Id} (produto {item.ProdutoId}).");
            }
        }

        await _unitOfWork.IniciarTransacaoAsync();
        try
        {
            // RN06: valida e baixa TODOS os itens dentro da mesma transação.
            // Se qualquer item não tiver saldo suficiente, a exceção interrompe o
            // laço e o catch desfaz tudo o que já havia sido decrementado.
            foreach (var item in itens)
            {
                var localizacaoId = localizacaoPorItem[item.Id];
                var quantidadeFaltante = item.QuantidadeSolicitada - item.QuantidadeExpedida;

                var sucesso = await _estoqueRepository.TentarDecrementarAsync(
                    item.ProdutoId, localizacaoId, quantidadeFaltante);

                if (!sucesso)
                {
                    throw new SaldoInsuficienteException(item.ProdutoId, localizacaoId, quantidadeFaltante);
                }

                await _movimentacaoRepository.RegistrarAsync(new MovimentacaoEstoque
                {
                    Id = Guid.NewGuid(),
                    ProdutoId = item.ProdutoId,
                    LocalizacaoOrigemId = localizacaoId,
                    Quantidade = quantidadeFaltante,
                    Tipo = TipoMovimentacao.Saida,
                    Data = DateTime.UtcNow,
                    UsuarioId = dto.UsuarioId
                });

                await _pedidoRepository.AtualizarQuantidadeExpedidaAsync(item.Id, item.QuantidadeSolicitada);
            }

            await _pedidoRepository.AtualizarStatusAsync(pedidoId, StatusPedido.Concluido, DateTime.UtcNow);

            await _unitOfWork.ConfirmarAsync();
        }
        catch
        {
            await _unitOfWork.DesfazerAsync();
            throw;
        }
    }

    private static PedidoExpedicaoDto ToDto(PedidoExpedicao pedido, IEnumerable<ItemPedidoExpedicao> itens) => new(
        pedido.Id,
        pedido.ClienteId,
        pedido.Status.ToString(),
        pedido.DataPrevista,
        pedido.DataExpedicao,
        itens.Select(i => new ItemPedidoExpedicaoDto(i.Id, i.ProdutoId, i.QuantidadeSolicitada, i.QuantidadeExpedida)).ToList());
}
