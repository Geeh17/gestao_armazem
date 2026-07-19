using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Exceptions;
using GestaoArmazem.Application.Interfaces;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;

namespace GestaoArmazem.Application.Services;

public class ArmazemService : IArmazemService
{
    private readonly IArmazemRepository _armazemRepository;

    public ArmazemService(IArmazemRepository armazemRepository)
    {
        _armazemRepository = armazemRepository;
    }

    public async Task<IEnumerable<ArmazemDto>> ListarAsync()
    {
        var armazens = await _armazemRepository.ListarAsync();
        return armazens.Select(a => new ArmazemDto(a.Id, a.Nome, a.Endereco));
    }

    public async Task<ArmazemDto> CriarAsync(CriarArmazemDto dto)
    {
        var armazem = new Armazem
        {
            Id = Guid.NewGuid(),
            Nome = dto.Nome,
            Endereco = dto.Endereco
        };

        await _armazemRepository.CriarAsync(armazem);
        return new ArmazemDto(armazem.Id, armazem.Nome, armazem.Endereco);
    }

    public async Task<ArmazemDto> AtualizarAsync(Guid id, AtualizarArmazemDto dto)
    {
        var armazem = await _armazemRepository.ObterPorIdAsync(id)
            ?? throw new NotFoundException("Armazém", id);

        armazem.Nome = dto.Nome;
        armazem.Endereco = dto.Endereco;

        await _armazemRepository.AtualizarAsync(armazem);
        return new ArmazemDto(armazem.Id, armazem.Nome, armazem.Endereco);
    }

    public async Task ExcluirAsync(Guid id)
    {
        _ = await _armazemRepository.ObterPorIdAsync(id) ?? throw new NotFoundException("Armazém", id);

        if (await _armazemRepository.PossuiReferenciasAsync(id))
        {
            throw new InvalidOperationException(
                "Este armazém não pode ser excluído porque já tem localizações cadastradas.");
        }

        await _armazemRepository.ExcluirAsync(id);
    }
}
