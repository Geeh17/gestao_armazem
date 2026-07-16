using Dapper;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Enums;
using GestaoArmazem.Domain.Interfaces;
using GestaoArmazem.Infrastructure.Data;

namespace GestaoArmazem.Infrastructure.Repositories;

public class PedidoRecebimentoRepository : IPedidoRecebimentoRepository
{
    private readonly ISqlContext _sql;

    public PedidoRecebimentoRepository(ISqlContext sql)
    {
        _sql = sql;
    }

    public async Task<Guid> CriarAsync(PedidoRecebimento pedido, IEnumerable<ItemPedidoRecebimento> itens)
    {
        const string sqlPedido = @"
            INSERT INTO PedidoRecebimento (Id, FornecedorId, Status, DataPrevista, DataRecebimento)
            VALUES (@Id, @FornecedorId, @Status, @DataPrevista, @DataRecebimento)";

        const string sqlItem = @"
            INSERT INTO ItemPedidoRecebimento (Id, PedidoRecebimentoId, ProdutoId, QuantidadeEsperada, QuantidadeRecebida)
            VALUES (@Id, @PedidoRecebimentoId, @ProdutoId, @QuantidadeEsperada, @QuantidadeRecebida)";

        // Pedido + itens são inseridos numa transação local: ou tudo é gravado, ou nada é.
        // Usa uma transação própria (em vez do IUnitOfWork compartilhado) porque esta
        // operação não precisa coordenar com outros repositórios na mesma chamada.
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

    public Task<PedidoRecebimento?> ObterPorIdAsync(Guid id) =>
        _sql.Connection.QuerySingleOrDefaultAsync<PedidoRecebimento?>(
            "SELECT * FROM PedidoRecebimento WHERE Id = @Id",
            new { Id = id }, _sql.Transaction);

    public Task<IEnumerable<ItemPedidoRecebimento>> ObterItensAsync(Guid pedidoId) =>
        _sql.Connection.QueryAsync<ItemPedidoRecebimento>(
            "SELECT * FROM ItemPedidoRecebimento WHERE PedidoRecebimentoId = @PedidoId",
            new { PedidoId = pedidoId }, _sql.Transaction);

    public Task<IEnumerable<PedidoRecebimento>> ListarAsync(int pagina, int tamanhoPagina) =>
        _sql.Connection.QueryAsync<PedidoRecebimento>(
            @"SELECT * FROM PedidoRecebimento
              ORDER BY DataPrevista DESC
              OFFSET @Skip ROWS FETCH NEXT @TamanhoPagina ROWS ONLY",
            new { Skip = (pagina - 1) * tamanhoPagina, TamanhoPagina = tamanhoPagina }, _sql.Transaction);

    public Task AtualizarStatusAsync(Guid pedidoId, StatusPedido status, DateTime? dataRecebimento) =>
        _sql.Connection.ExecuteAsync(
            "UPDATE PedidoRecebimento SET Status = @Status, DataRecebimento = @DataRecebimento WHERE Id = @Id",
            new { Id = pedidoId, Status = status, DataRecebimento = dataRecebimento }, _sql.Transaction);

    public Task<ItemPedidoRecebimento?> ObterItemPorIdAsync(Guid itemId) =>
        _sql.Connection.QuerySingleOrDefaultAsync<ItemPedidoRecebimento?>(
            "SELECT * FROM ItemPedidoRecebimento WHERE Id = @Id",
            new { Id = itemId }, _sql.Transaction);

    public Task AtualizarQuantidadeRecebidaAsync(Guid itemId, int quantidadeRecebida) =>
        _sql.Connection.ExecuteAsync(
            "UPDATE ItemPedidoRecebimento SET QuantidadeRecebida = @QuantidadeRecebida WHERE Id = @Id",
            new { Id = itemId, QuantidadeRecebida = quantidadeRecebida }, _sql.Transaction);
}
