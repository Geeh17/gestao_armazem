using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Interfaces;

public interface IProdutoService
{
    Task<ProdutoDto?> ObterPorIdAsync(Guid id);
    Task<IEnumerable<ProdutoDto>> ListarAsync(int pagina, int tamanhoPagina);
    Task<ProdutoDto> CriarAsync(CriarProdutoDto dto);
    Task<ProdutoDto> AtualizarAsync(Guid id, AtualizarProdutoDto dto);
    Task ExcluirAsync(Guid id);
}
