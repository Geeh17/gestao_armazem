using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Interfaces;

public interface ICategoriaService
{
    Task<IEnumerable<CategoriaDto>> ListarAsync();
    Task<CategoriaDto> CriarAsync(CriarCategoriaDto dto);
    Task<CategoriaDto> AtualizarAsync(Guid id, AtualizarCategoriaDto dto);
    Task ExcluirAsync(Guid id);
}
