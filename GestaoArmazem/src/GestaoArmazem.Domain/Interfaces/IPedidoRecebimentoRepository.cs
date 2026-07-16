using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Enums;

namespace GestaoArmazem.Domain.Interfaces;

public interface IPedidoRecebimentoRepository
{
    Task<Guid> CriarAsync(PedidoRecebimento pedido, IEnumerable<ItemPedidoRecebimento> itens);
    Task<PedidoRecebimento?> ObterPorIdAsync(Guid id);
    Task<IEnumerable<ItemPedidoRecebimento>> ObterItensAsync(Guid pedidoId);
    Task<IEnumerable<PedidoRecebimento>> ListarAsync(int pagina, int tamanhoPagina);
    Task AtualizarStatusAsync(Guid pedidoId, StatusPedido status, DateTime? dataRecebimento);
    Task<ItemPedidoRecebimento?> ObterItemPorIdAsync(Guid itemId);
    Task AtualizarQuantidadeRecebidaAsync(Guid itemId, int quantidadeRecebida);
}
