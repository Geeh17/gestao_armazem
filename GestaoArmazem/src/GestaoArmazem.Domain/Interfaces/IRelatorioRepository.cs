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

public record FiltroPedidosRecebimento(
    Guid? FornecedorId,
    StatusPedido? Status,
    DateTime? DataInicio,
    DateTime? DataFim,
    int Pagina,
    int TamanhoPagina);

public record FiltroPedidosExpedicao(
    Guid? ClienteId,
    StatusPedido? Status,
    DateTime? DataInicio,
    DateTime? DataFim,
    int Pagina,
    int TamanhoPagina);

/// <summary>Pedido de recebimento com nome do fornecedor e contagem de itens já resolvidos —
/// evita que o relatório precise de outra ida ao banco pra montar essas colunas.
/// Classe (não record): o Dapper materializa via construtor posicional em records, e não
/// consegue casar automaticamente o TINYINT do banco com um parâmetro enum nessa via —
/// mesmo motivo pelo qual MovimentacaoEstoque também é uma classe comum, não um record.</summary>
public class PedidoRecebimentoResumo
{
    public Guid Id { get; set; }
    public Guid FornecedorId { get; set; }
    public string FornecedorNome { get; set; } = string.Empty;
    public StatusPedido Status { get; set; }
    public DateTime DataPrevista { get; set; }
    public DateTime? DataRecebimento { get; set; }
    public int QuantidadeItens { get; set; }
}

public class PedidoExpedicaoResumo
{
    public Guid Id { get; set; }
    public Guid ClienteId { get; set; }
    public string ClienteNome { get; set; } = string.Empty;
    public StatusPedido Status { get; set; }
    public DateTime DataPrevista { get; set; }
    public DateTime? DataExpedicao { get; set; }
    public int QuantidadeItens { get; set; }
}

/// <summary>
/// Repositório dedicado a consultas de relatório (somente leitura, agregadas).
/// Separado dos repositórios de escrita porque essas consultas não pertencem a
/// nenhum agregado específico — são projeções sobre várias tabelas.
/// </summary>
public interface IRelatorioRepository
{
    Task<IEnumerable<EstoqueBaixoResumo>> ListarProdutosComEstoqueBaixoAsync();
    Task<IEnumerable<MovimentacaoEstoque>> ListarMovimentacoesAsync(FiltroMovimentacoes filtro);
    Task<IEnumerable<PedidoRecebimentoResumo>> ListarPedidosRecebimentoAsync(FiltroPedidosRecebimento filtro);
    Task<IEnumerable<PedidoExpedicaoResumo>> ListarPedidosExpedicaoAsync(FiltroPedidosExpedicao filtro);
}
