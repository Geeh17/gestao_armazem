using GestaoArmazem.Domain.Entities;

namespace GestaoArmazem.Domain.Interfaces;

public interface IProdutoRepository
{
    Task<Produto?> ObterPorIdAsync(Guid id);
    Task<Produto?> ObterPorSkuAsync(string sku);
    Task<IEnumerable<Produto>> ListarAsync(int pagina, int tamanhoPagina);
    Task<Guid> CriarAsync(Produto produto);
    Task AtualizarAsync(Produto produto);
}
