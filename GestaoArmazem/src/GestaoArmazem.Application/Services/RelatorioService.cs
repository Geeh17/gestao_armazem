using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Interfaces;
using GestaoArmazem.Domain.Enums;
using GestaoArmazem.Domain.Interfaces;

namespace GestaoArmazem.Application.Services;

public class RelatorioService : IRelatorioService
{
    private readonly IRelatorioRepository _relatorioRepository;

    public RelatorioService(IRelatorioRepository relatorioRepository)
    {
        _relatorioRepository = relatorioRepository;
    }

    public async Task<IEnumerable<EstoqueBaixoDto>> ListarProdutosComEstoqueBaixoAsync()
    {
        var resumos = await _relatorioRepository.ListarProdutosComEstoqueBaixoAsync();
        return resumos.Select(r => new EstoqueBaixoDto(r.ProdutoId, r.Sku, r.Nome, r.SaldoTotal, r.EstoqueMinimo));
    }

    public async Task<IEnumerable<MovimentacaoRelatorioDto>> ListarMovimentacoesAsync(
        Guid? produtoId, string? tipo, DateTime? dataInicio, DateTime? dataFim, int pagina, int tamanhoPagina)
    {
        TipoMovimentacao? tipoEnum = null;
        if (!string.IsNullOrWhiteSpace(tipo) && Enum.TryParse<TipoMovimentacao>(tipo, ignoreCase: true, out var parsed))
        {
            tipoEnum = parsed;
        }

        var filtro = new FiltroMovimentacoes(produtoId, tipoEnum, dataInicio, dataFim, pagina, tamanhoPagina);
        var movimentacoes = await _relatorioRepository.ListarMovimentacoesAsync(filtro);

        return movimentacoes.Select(m => new MovimentacaoRelatorioDto(
            m.Id, m.ProdutoId, m.LocalizacaoOrigemId, m.LocalizacaoDestinoId,
            m.Quantidade, m.Tipo.ToString(), m.Data, m.UsuarioId));
    }

    public async Task<IEnumerable<PedidoRecebimentoRelatorioDto>> ListarPedidosRecebimentoAsync(
        Guid? fornecedorId, string? status, DateTime? dataInicio, DateTime? dataFim, int pagina, int tamanhoPagina)
    {
        var statusEnum = ParseStatus(status);
        var filtro = new FiltroPedidosRecebimento(fornecedorId, statusEnum, dataInicio, dataFim, pagina, tamanhoPagina);
        var pedidos = await _relatorioRepository.ListarPedidosRecebimentoAsync(filtro);

        return pedidos.Select(p => new PedidoRecebimentoRelatorioDto(
            p.Id, p.FornecedorId, p.FornecedorNome, p.Status.ToString(),
            p.DataPrevista, p.DataRecebimento, p.QuantidadeItens));
    }

    public async Task<IEnumerable<PedidoExpedicaoRelatorioDto>> ListarPedidosExpedicaoAsync(
        Guid? clienteId, string? status, DateTime? dataInicio, DateTime? dataFim, int pagina, int tamanhoPagina)
    {
        var statusEnum = ParseStatus(status);
        var filtro = new FiltroPedidosExpedicao(clienteId, statusEnum, dataInicio, dataFim, pagina, tamanhoPagina);
        var pedidos = await _relatorioRepository.ListarPedidosExpedicaoAsync(filtro);

        return pedidos.Select(p => new PedidoExpedicaoRelatorioDto(
            p.Id, p.ClienteId, p.ClienteNome, p.Status.ToString(),
            p.DataPrevista, p.DataExpedicao, p.QuantidadeItens));
    }

    private static StatusPedido? ParseStatus(string? status) =>
        !string.IsNullOrWhiteSpace(status) && Enum.TryParse<StatusPedido>(status, ignoreCase: true, out var parsed)
            ? parsed
            : null;
}
