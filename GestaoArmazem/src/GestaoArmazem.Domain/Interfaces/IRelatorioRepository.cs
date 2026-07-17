using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Enums;

namespace GestaoArmazem.Domain.Interfaces;

/// <summary>Projeção de leitura: produto cujo saldo total está abaixo do estoque mínimo.</summary>
public record EstoqueBaixoResumo(Guid ProdutoId, string Sku, string Nome, int SaldoTotal, int EstoqueMinimo);

public record FiltroMovimentacoes(
    Guid? ProdutoId,
    TipoMovimentacao? Tipo,
    DateTime? DataInicio,
    DateTime? DataFim,
    int Pagina,
    int TamanhoPagina);

/// <summary>
/// Repositório dedicado a consultas de relatório (somente leitura, agregadas).
/// Separado dos repositórios de escrita porque essas consultas não pertencem a
/// nenhum agregado específico — são projeções sobre várias tabelas.
/// </summary>
public interface IRelatorioRepository
{
    Task<IEnumerable<EstoqueBaixoResumo>> ListarProdutosComEstoqueBaixoAsync();
    Task<IEnumerable<MovimentacaoEstoque>> ListarMovimentacoesAsync(FiltroMovimentacoes filtro);
}
