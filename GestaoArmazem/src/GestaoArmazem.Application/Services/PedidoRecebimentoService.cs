using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Exceptions;
using GestaoArmazem.Application.Interfaces;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Enums;
using GestaoArmazem.Domain.Interfaces;

namespace GestaoArmazem.Application.Services;

public class PedidoRecebimentoService : IPedidoRecebimentoService
{
    private readonly IPedidoRecebimentoRepository _pedidoRepository;
    private readonly IMovimentacaoService _movimentacaoService;

    public PedidoRecebimentoService(
        IPedidoRecebimentoRepository pedidoRepository,
        IMovimentacaoService movimentacaoService)
    {
        _pedidoRepository = pedidoRepository;
        _movimentacaoService = movimentacaoService;
    }

    public async Task<PedidoRecebimentoDto> CriarAsync(CriarPedidoRecebimentoDto dto)
    {
        if (dto.Itens is null || dto.Itens.Count == 0)
        {
            throw new InvalidOperationException("O pedido de recebimento deve conter ao menos um item.");
        }

        var pedido = new PedidoRecebimento
        {
            Id = Guid.NewGuid(),
            FornecedorId = dto.FornecedorId,
            Status = StatusPedido.Pendente,
            DataPrevista = dto.DataPrevista
        };

        var itens = dto.Itens.Select(i => new ItemPedidoRecebimento
        {
            Id = Guid.NewGuid(),
            PedidoRecebimentoId = pedido.Id,
            ProdutoId = i.ProdutoId,
            QuantidadeEsperada = i.QuantidadeEsperada,
            QuantidadeRecebida = 0
        }).ToList();

        await _pedidoRepository.CriarAsync(pedido, itens);

        return ToDto(pedido, itens);
    }

    public async Task<PedidoRecebimentoDto?> ObterPorIdAsync(Guid id)
    {
        var pedido = await _pedidoRepository.ObterPorIdAsync(id);
        if (pedido is null) return null;

        var itens = await _pedidoRepository.ObterItensAsync(id);
        return ToDto(pedido, itens);
    }

    public async Task<IEnumerable<PedidoRecebimentoDto>> ListarAsync(int pagina, int tamanhoPagina)
    {
        var pedidos = await _pedidoRepository.ListarAsync(pagina, tamanhoPagina);

        var resultado = new List<PedidoRecebimentoDto>();
        foreach (var pedido in pedidos)
        {
            var itens = await _pedidoRepository.ObterItensAsync(pedido.Id);
            resultado.Add(ToDto(pedido, itens));
        }
        return resultado;
    }

    public async Task ConfirmarRecebimentoItemAsync(Guid pedidoId, Guid itemId, ConfirmarRecebimentoItemDto dto)
    {
        var pedido = await _pedidoRepository.ObterPorIdAsync(pedidoId)
            ?? throw new NotFoundException("Pedido de recebimento", pedidoId);

        if (pedido.Status is StatusPedido.Concluido or StatusPedido.Cancelado)
        {
            throw new InvalidOperationException(
                $"O pedido {pedidoId} já está {pedido.Status} e não aceita novas confirmações de recebimento.");
        }

        var item = await _pedidoRepository.ObterItemPorIdAsync(itemId)
            ?? throw new NotFoundException("Item do pedido de recebimento", itemId);

        if (item.PedidoRecebimentoId != pedidoId)
        {
            throw new InvalidOperationException($"O item {itemId} não pertence ao pedido {pedidoId}.");
        }

        if (dto.QuantidadeRecebida <= 0)
        {
            throw new InvalidOperationException("A quantidade recebida deve ser maior que zero.");
        }

        // UC01: confirmar o recebimento dá entrada física no estoque na localização informada.
        await _movimentacaoService.RegistrarEntradaAsync(new MovimentacaoEntradaDto(
            item.ProdutoId, dto.LocalizacaoId, dto.QuantidadeRecebida, dto.UsuarioId));

        var novaQuantidadeRecebida = item.QuantidadeRecebida + dto.QuantidadeRecebida;
        await _pedidoRepository.AtualizarQuantidadeRecebidaAsync(itemId, novaQuantidadeRecebida);

        // RN05: o pedido só é encerrado quando todos os itens tiverem sido totalmente recebidos.
        var itensAtualizados = (await _pedidoRepository.ObterItensAsync(pedidoId)).ToList();
        var todosCompletos = itensAtualizados.All(i =>
            i.Id == itemId
                ? novaQuantidadeRecebida >= i.QuantidadeEsperada
                : i.QuantidadeRecebida >= i.QuantidadeEsperada);

        if (todosCompletos)
        {
            await _pedidoRepository.AtualizarStatusAsync(pedidoId, StatusPedido.Concluido, DateTime.UtcNow);
        }
        else if (pedido.Status == StatusPedido.Pendente)
        {
            await _pedidoRepository.AtualizarStatusAsync(pedidoId, StatusPedido.EmAndamento, null);
        }
    }

    public async Task CancelarAsync(Guid pedidoId)
    {
        var pedido = await _pedidoRepository.ObterPorIdAsync(pedidoId)
            ?? throw new NotFoundException("Pedido de recebimento", pedidoId);

        if (pedido.Status is StatusPedido.Concluido or StatusPedido.Cancelado)
        {
            throw new InvalidOperationException(
                $"O pedido {pedidoId} já está {pedido.Status} e não pode ser cancelado.");
        }

        await _pedidoRepository.AtualizarStatusAsync(pedidoId, StatusPedido.Cancelado, null);
    }

    private static PedidoRecebimentoDto ToDto(PedidoRecebimento pedido, IEnumerable<ItemPedidoRecebimento> itens) => new(
        pedido.Id,
        pedido.FornecedorId,
        pedido.Status.ToString(),
        pedido.DataPrevista,
        pedido.DataRecebimento,
        itens.Select(i => new ItemPedidoRecebimentoDto(i.Id, i.ProdutoId, i.QuantidadeEsperada, i.QuantidadeRecebida)).ToList());
}
