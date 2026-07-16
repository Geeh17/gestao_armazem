using Dapper;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;
using GestaoArmazem.Infrastructure.Data;

namespace GestaoArmazem.Infrastructure.Repositories;

public class MovimentacaoEstoqueRepository : IMovimentacaoEstoqueRepository
{
    private readonly ISqlContext _sql;

    public MovimentacaoEstoqueRepository(ISqlContext sql)
    {
        _sql = sql;
    }

    public async Task<Guid> RegistrarAsync(MovimentacaoEstoque movimentacao)
    {
        // RN02: tabela somente-inserção — não existe UPDATE/DELETE para esta entidade.
        const string sql = @"
            INSERT INTO MovimentacaoEstoque
                (Id, ProdutoId, LocalizacaoOrigemId, LocalizacaoDestinoId, Quantidade, Tipo, Data, UsuarioId)
            VALUES
                (@Id, @ProdutoId, @LocalizacaoOrigemId, @LocalizacaoDestinoId, @Quantidade, @Tipo, @Data, @UsuarioId)";

        await _sql.Connection.ExecuteAsync(sql, movimentacao, _sql.Transaction);
        return movimentacao.Id;
    }

    public Task<IEnumerable<MovimentacaoEstoque>> ListarPorProdutoAsync(Guid produtoId) =>
        _sql.Connection.QueryAsync<MovimentacaoEstoque>(
            "SELECT * FROM MovimentacaoEstoque WHERE ProdutoId = @ProdutoId ORDER BY Data DESC",
            new { ProdutoId = produtoId }, _sql.Transaction);
}
