using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Interfaces;

public interface IRelatorioService
{
    Task<IEnumerable<EstoqueBaixoDto>> ListarProdutosComEstoqueBaixoAsync();

    Task<IEnumerable<MovimentacaoRelatorioDto>> ListarMovimentacoesAsync(
        Guid? produtoId,
        string? tipo,
        DateTime? dataInicio,
        DateTime? dataFim,
        int pagina,
        int tamanhoPagina);

    Task<IEnumerable<PedidoRecebimentoRelatorioDto>> ListarPedidosRecebimentoAsync(
        Guid? fornecedorId,
        string? status,
        DateTime? dataInicio,
        DateTime? dataFim,
        int pagina,
        int tamanhoPagina);

    Task<IEnumerable<PedidoExpedicaoRelatorioDto>> ListarPedidosExpedicaoAsync(
        Guid? clienteId,
        string? status,
        DateTime? dataInicio,
        DateTime? dataFim,
        int pagina,
        int tamanhoPagina);
}
