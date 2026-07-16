using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Interfaces;
using GestaoArmazem.Domain.Interfaces;

namespace GestaoArmazem.Application.Services;

public class CategoriaService : ICategoriaService
{
    private readonly ICategoriaRepository _categoriaRepository;

    public CategoriaService(ICategoriaRepository categoriaRepository)
    {
        _categoriaRepository = categoriaRepository;
    }

    public async Task<IEnumerable<CategoriaDto>> ListarAsync()
    {
        var categorias = await _categoriaRepository.ListarAsync();
        return categorias.Select(c => new CategoriaDto(c.Id, c.Nome));
    }
}
