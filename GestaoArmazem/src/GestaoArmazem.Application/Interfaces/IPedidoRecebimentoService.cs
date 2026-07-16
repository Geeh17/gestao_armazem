using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Interfaces;

public interface IPedidoRecebimentoService
{
    Task<PedidoRecebimentoDto> CriarAsync(CriarPedidoRecebimentoDto dto);
    Task<PedidoRecebimentoDto?> ObterPorIdAsync(Guid id);
    Task<IEnumerable<PedidoRecebimentoDto>> ListarAsync(int pagina, int tamanhoPagina);

    /// <summary>
    /// Confirma o recebimento de um item do pedido: dá entrada no estoque (UC01) e
    /// atualiza a quantidade recebida. Quando todos os itens estiverem completos,
    /// encerra o pedido automaticamente (RN05).
    /// </summary>
    Task ConfirmarRecebimentoItemAsync(Guid pedidoId, Guid itemId, ConfirmarRecebimentoItemDto dto);
}
