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
}
