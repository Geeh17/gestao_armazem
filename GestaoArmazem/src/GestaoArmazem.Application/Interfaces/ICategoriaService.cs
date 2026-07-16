using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Interfaces;

public interface ICategoriaService
{
    Task<IEnumerable<CategoriaDto>> ListarAsync();
}
