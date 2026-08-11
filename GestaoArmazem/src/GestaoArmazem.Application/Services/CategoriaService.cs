using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Exceptions;
using GestaoArmazem.Application.Interfaces;
using GestaoArmazem.Domain.Entities;
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

    public async Task<CategoriaDto> CriarAsync(CriarCategoriaDto dto)
    {
        var categoria = new Categoria { Id = Guid.NewGuid(), Nome = dto.Nome };
        await _categoriaRepository.CriarAsync(categoria);
        return new CategoriaDto(categoria.Id, categoria.Nome);
    }

    public async Task<CategoriaDto> AtualizarAsync(Guid id, AtualizarCategoriaDto dto)
    {
        var categoria = await _categoriaRepository.ObterPorIdAsync(id)
            ?? throw new NotFoundException("Categoria", id);

        categoria.Nome = dto.Nome;

        await _categoriaRepository.AtualizarAsync(categoria);
        return new CategoriaDto(categoria.Id, categoria.Nome);
    }

    public async Task ExcluirAsync(Guid id)
    {
        _ = await _categoriaRepository.ObterPorIdAsync(id) ?? throw new NotFoundException("Categoria", id);

        if (await _categoriaRepository.PossuiReferenciasAsync(id))
        {
            throw new InvalidOperationException(
                "Esta categoria não pode ser excluída porque já tem produtos associados.");
        }

        await _categoriaRepository.ExcluirAsync(id);
    }
}
