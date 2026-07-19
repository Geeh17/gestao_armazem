using GestaoArmazem.Domain.Entities;

namespace GestaoArmazem.Domain.Interfaces;

public interface IProdutoRepository
{
    Task<Produto?> ObterPorIdAsync(Guid id);
    Task<Produto?> ObterPorSkuAsync(string sku);
    Task<IEnumerable<Produto>> ListarAsync(int pagina, int tamanhoPagina);
    Task<Guid> CriarAsync(Produto produto);
    Task AtualizarAsync(Produto produto);

    /// <summary>Indica se o produto está referenciado em estoque, movimentações ou itens de pedido.</summary>
    Task<bool> PossuiReferenciasAsync(Guid id);
    Task ExcluirAsync(Guid id);
}
