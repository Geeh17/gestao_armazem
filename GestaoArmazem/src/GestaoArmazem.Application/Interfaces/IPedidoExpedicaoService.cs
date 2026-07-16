using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Interfaces;

public interface IPedidoExpedicaoService
{
    Task<PedidoExpedicaoDto> CriarAsync(CriarPedidoExpedicaoDto dto);
    Task<PedidoExpedicaoDto?> ObterPorIdAsync(Guid id);
    Task<IEnumerable<PedidoExpedicaoDto>> ListarAsync(int pagina, int tamanhoPagina);

    /// <summary>
    /// Expede o pedido inteiro (RF08, UC06). RN06: só executa se houver saldo
    /// suficiente para TODOS os itens — caso contrário, nada é baixado do estoque.
    /// </summary>
    Task ExpedirAsync(Guid pedidoId, ExpedirPedidoDto dto);
}
