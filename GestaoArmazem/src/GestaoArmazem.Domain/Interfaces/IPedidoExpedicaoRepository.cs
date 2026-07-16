using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Enums;

namespace GestaoArmazem.Domain.Interfaces;

public interface IPedidoExpedicaoRepository
{
    Task<Guid> CriarAsync(PedidoExpedicao pedido, IEnumerable<ItemPedidoExpedicao> itens);
    Task<PedidoExpedicao?> ObterPorIdAsync(Guid id);
    Task<IEnumerable<ItemPedidoExpedicao>> ObterItensAsync(Guid pedidoId);
    Task<IEnumerable<PedidoExpedicao>> ListarAsync(int pagina, int tamanhoPagina);
    Task AtualizarStatusAsync(Guid pedidoId, StatusPedido status, DateTime? dataExpedicao);
    Task AtualizarQuantidadeExpedidaAsync(Guid itemId, int quantidadeExpedida);
}
