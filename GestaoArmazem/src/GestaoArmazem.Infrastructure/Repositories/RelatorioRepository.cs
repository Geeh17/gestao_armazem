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
}
