using Dapper;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;
using GestaoArmazem.Infrastructure.Data;

namespace GestaoArmazem.Infrastructure.Repositories;

public class ProdutoRepository : IProdutoRepository
{
    private readonly ISqlContext _sql;

    public ProdutoRepository(ISqlContext sql)
    {
        _sql = sql;
    }

    public Task<Produto?> ObterPorIdAsync(Guid id) =>
        _sql.Connection.QuerySingleOrDefaultAsync<Produto?>(
            "SELECT * FROM Produto WHERE Id = @Id",
            new { Id = id }, _sql.Transaction);

    public Task<Produto?> ObterPorSkuAsync(string sku) =>
        _sql.Connection.QuerySingleOrDefaultAsync<Produto?>(
            "SELECT * FROM Produto WHERE SKU = @Sku",
            new { Sku = sku }, _sql.Transaction);

    public Task<IEnumerable<Produto>> ListarAsync(int pagina, int tamanhoPagina) =>
        _sql.Connection.QueryAsync<Produto>(
            @"SELECT * FROM Produto
              ORDER BY Nome
              OFFSET @Skip ROWS FETCH NEXT @TamanhoPagina ROWS ONLY",
            new { Skip = (pagina - 1) * tamanhoPagina, TamanhoPagina = tamanhoPagina }, _sql.Transaction);

    public async Task<Guid> CriarAsync(Produto produto)
    {
        const string sql = @"
            INSERT INTO Produto (Id, SKU, Nome, Descricao, CategoriaId, UnidadeMedida, CodigoBarras, EstoqueMinimo)
            VALUES (@Id, @SKU, @Nome, @Descricao, @CategoriaId, @UnidadeMedida, @CodigoBarras, @EstoqueMinimo)";

        await _sql.Connection.ExecuteAsync(sql, produto, _sql.Transaction);
        return produto.Id;
    }

    public Task AtualizarAsync(Produto produto)
    {
        const string sql = @"
            UPDATE Produto SET
                Nome = @Nome,
                Descricao = @Descricao,
                CategoriaId = @CategoriaId,
                UnidadeMedida = @UnidadeMedida,
                CodigoBarras = @CodigoBarras,
                EstoqueMinimo = @EstoqueMinimo
            WHERE Id = @Id";

        return _sql.Connection.ExecuteAsync(sql, produto, _sql.Transaction);
    }

    public async Task<bool> PossuiReferenciasAsync(Guid id)
    {
        const string sql = @"
            SELECT CASE WHEN EXISTS (
                SELECT 1 FROM Estoque WHERE ProdutoId = @Id
                UNION ALL SELECT 1 FROM MovimentacaoEstoque WHERE ProdutoId = @Id
                UNION ALL SELECT 1 FROM ItemPedidoRecebimento WHERE ProdutoId = @Id
                UNION ALL SELECT 1 FROM ItemPedidoExpedicao WHERE ProdutoId = @Id
            ) THEN 1 ELSE 0 END";

        return await _sql.Connection.ExecuteScalarAsync<bool>(sql, new { Id = id }, _sql.Transaction);
    }

    public Task ExcluirAsync(Guid id) =>
        _sql.Connection.ExecuteAsync("DELETE FROM Produto WHERE Id = @Id", new { Id = id }, _sql.Transaction);
}
