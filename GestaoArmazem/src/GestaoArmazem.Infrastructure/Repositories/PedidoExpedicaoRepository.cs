using Dapper;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Enums;
using GestaoArmazem.Domain.Interfaces;
using GestaoArmazem.Infrastructure.Data;

namespace GestaoArmazem.Infrastructure.Repositories;

public class PedidoExpedicaoRepository : IPedidoExpedicaoRepository
{
    private readonly ISqlContext _sql;

    public PedidoExpedicaoRepository(ISqlContext sql)
    {
        _sql = sql;
    }

    public async Task<Guid> CriarAsync(PedidoExpedicao pedido, IEnumerable<ItemPedidoExpedicao> itens)
    {
        const string sqlPedido = @"
            INSERT INTO PedidoExpedicao (Id, ClienteId, Status, DataPrevista, DataExpedicao)
            VALUES (@Id, @ClienteId, @Status, @DataPrevista, @DataExpedicao)";

        const string sqlItem = @"
            INSERT INTO ItemPedidoExpedicao (Id, PedidoExpedicaoId, ProdutoId, QuantidadeSolicitada, QuantidadeExpedida)
            VALUES (@Id, @PedidoExpedicaoId, @ProdutoId, @QuantidadeSolicitada, @QuantidadeExpedida)";

        // Mesma lógica do PedidoRecebimentoRepository: transação local própria,
        // já que esta operação não precisa coordenar com outros repositórios aqui.
        var transacaoLocal = _sql.Transaction is null;
        var transaction = _sql.Transaction ?? _sql.Connection.BeginTransaction();
        try
        {
            await _sql.Connection.ExecuteAsync(sqlPedido, pedido, transaction);
            await _sql.Connection.ExecuteAsync(sqlItem, itens, transaction);

            if (transacaoLocal) transaction.Commit();
        }
        catch
        {
            if (transacaoLocal) transaction.Rollback();
            throw;
        }

        return pedido.Id;
    }

    public Task<PedidoExpedicao?> ObterPorIdAsync(Guid id) =>
        _sql.Connection.QuerySingleOrDefaultAsync<PedidoExpedicao?>(
            "SELECT * FROM PedidoExpedicao WHERE Id = @Id",
            new { Id = id }, _sql.Transaction);

    public Task<IEnumerable<ItemPedidoExpedicao>> ObterItensAsync(Guid pedidoId) =>
        _sql.Connection.QueryAsync<ItemPedidoExpedicao>(
            "SELECT * FROM ItemPedidoExpedicao WHERE PedidoExpedicaoId = @PedidoId",
            new { PedidoId = pedidoId }, _sql.Transaction);

    public Task<IEnumerable<PedidoExpedicao>> ListarAsync(int pagina, int tamanhoPagina) =>
        _sql.Connection.QueryAsync<PedidoExpedicao>(
            @"SELECT * FROM PedidoExpedicao
              ORDER BY DataPrevista DESC
              OFFSET @Skip ROWS FETCH NEXT @TamanhoPagina ROWS ONLY",
            new { Skip = (pagina - 1) * tamanhoPagina, TamanhoPagina = tamanhoPagina }, _sql.Transaction);

    public Task AtualizarStatusAsync(Guid pedidoId, StatusPedido status, DateTime? dataExpedicao) =>
        _sql.Connection.ExecuteAsync(
            "UPDATE PedidoExpedicao SET Status = @Status, DataExpedicao = @DataExpedicao WHERE Id = @Id",
            new { Id = pedidoId, Status = status, DataExpedicao = dataExpedicao }, _sql.Transaction);

    public Task AtualizarQuantidadeExpedidaAsync(Guid itemId, int quantidadeExpedida) =>
        _sql.Connection.ExecuteAsync(
            "UPDATE ItemPedidoExpedicao SET QuantidadeExpedida = @QuantidadeExpedida WHERE Id = @Id",
            new { Id = itemId, QuantidadeExpedida = quantidadeExpedida }, _sql.Transaction);
}
