using Dapper;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;
using GestaoArmazem.Infrastructure.Data;

namespace GestaoArmazem.Infrastructure.Repositories;

public class RelatorioRepository : IRelatorioRepository
{
    private readonly ISqlContext _sql;

    public RelatorioRepository(ISqlContext sql)
    {
        _sql = sql;
    }

    public Task<IEnumerable<EstoqueBaixoResumo>> ListarProdutosComEstoqueBaixoAsync()
    {
        // Soma o saldo do produto em todas as localizações e compara com o mínimo
        // cadastrado. LEFT JOIN garante que produtos sem nenhum registro de estoque
        // (saldo zero) também apareçam no relatório.
        const string sql = @"
            SELECT p.Id AS ProdutoId, p.SKU AS Sku, p.Nome,
                   ISNULL(SUM(e.Quantidade), 0) AS SaldoTotal, p.EstoqueMinimo
            FROM Produto p
            LEFT JOIN Estoque e ON e.ProdutoId = p.Id
            GROUP BY p.Id, p.SKU, p.Nome, p.EstoqueMinimo
            HAVING ISNULL(SUM(e.Quantidade), 0) < p.EstoqueMinimo
            ORDER BY p.Nome";

        return _sql.Connection.QueryAsync<EstoqueBaixoResumo>(sql, transaction: _sql.Transaction);
    }

    public Task<IEnumerable<MovimentacaoEstoque>> ListarMovimentacoesAsync(FiltroMovimentacoes filtro)
    {
        const string sql = @"
            SELECT * FROM MovimentacaoEstoque
            WHERE (@ProdutoId IS NULL OR ProdutoId = @ProdutoId)
              AND (@Tipo IS NULL OR Tipo = @Tipo)
              AND (@DataInicio IS NULL OR Data >= @DataInicio)
              AND (@DataFim IS NULL OR Data <= @DataFim)
            ORDER BY Data DESC
            OFFSET @Skip ROWS FETCH NEXT @TamanhoPagina ROWS ONLY";

        return _sql.Connection.QueryAsync<MovimentacaoEstoque>(sql, new
        {
            filtro.ProdutoId,
            Tipo = filtro.Tipo.HasValue ? (byte)filtro.Tipo.Value : (byte?)null,
            filtro.DataInicio,
            filtro.DataFim,
            Skip = (filtro.Pagina - 1) * filtro.TamanhoPagina,
            filtro.TamanhoPagina
        }, _sql.Transaction);
    }

    public Task<IEnumerable<PedidoRecebimentoResumo>> ListarPedidosRecebimentoAsync(FiltroPedidosRecebimento filtro)
    {
        const string sql = @"
            SELECT pr.Id, pr.FornecedorId, f.Nome AS FornecedorNome, pr.Status,
                   pr.DataPrevista, pr.DataRecebimento,
                   (SELECT COUNT(*) FROM ItemPedidoRecebimento i WHERE i.PedidoRecebimentoId = pr.Id) AS QuantidadeItens
            FROM PedidoRecebimento pr
            JOIN Fornecedor f ON f.Id = pr.FornecedorId
            WHERE (@FornecedorId IS NULL OR pr.FornecedorId = @FornecedorId)
              AND (@Status IS NULL OR pr.Status = @Status)
              AND (@DataInicio IS NULL OR pr.DataPrevista >= @DataInicio)
              AND (@DataFim IS NULL OR pr.DataPrevista <= @DataFim)
            ORDER BY pr.DataPrevista DESC
            OFFSET @Skip ROWS FETCH NEXT @TamanhoPagina ROWS ONLY";

        return _sql.Connection.QueryAsync<PedidoRecebimentoResumo>(sql, new
        {
            filtro.FornecedorId,
            Status = filtro.Status.HasValue ? (byte)filtro.Status.Value : (byte?)null,
            filtro.DataInicio,
            filtro.DataFim,
            Skip = (filtro.Pagina - 1) * filtro.TamanhoPagina,
            filtro.TamanhoPagina
        }, _sql.Transaction);
    }

    public Task<IEnumerable<PedidoExpedicaoResumo>> ListarPedidosExpedicaoAsync(FiltroPedidosExpedicao filtro)
    {
        const string sql = @"
            SELECT pe.Id, pe.ClienteId, c.Nome AS ClienteNome, pe.Status,
                   pe.DataPrevista, pe.DataExpedicao,
                   (SELECT COUNT(*) FROM ItemPedidoExpedicao i WHERE i.PedidoExpedicaoId = pe.Id) AS QuantidadeItens
            FROM PedidoExpedicao pe
            JOIN Cliente c ON c.Id = pe.ClienteId
            WHERE (@ClienteId IS NULL OR pe.ClienteId = @ClienteId)
              AND (@Status IS NULL OR pe.Status = @Status)
              AND (@DataInicio IS NULL OR pe.DataPrevista >= @DataInicio)
              AND (@DataFim IS NULL OR pe.DataPrevista <= @DataFim)
            ORDER BY pe.DataPrevista DESC
            OFFSET @Skip ROWS FETCH NEXT @TamanhoPagina ROWS ONLY";

        return _sql.Connection.QueryAsync<PedidoExpedicaoResumo>(sql, new
        {
            filtro.ClienteId,
            Status = filtro.Status.HasValue ? (byte)filtro.Status.Value : (byte?)null,
            filtro.DataInicio,
            filtro.DataFim,
            Skip = (filtro.Pagina - 1) * filtro.TamanhoPagina,
            filtro.TamanhoPagina
        }, _sql.Transaction);
    }
}
