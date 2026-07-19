using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Exceptions;
using GestaoArmazem.Application.Interfaces;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;

namespace GestaoArmazem.Application.Services;

public class LocalizacaoService : ILocalizacaoService
{
    private readonly ILocalizacaoRepository _localizacaoRepository;
    private readonly IArmazemRepository _armazemRepository;

    public LocalizacaoService(ILocalizacaoRepository localizacaoRepository, IArmazemRepository armazemRepository)
    {
        _localizacaoRepository = localizacaoRepository;
        _armazemRepository = armazemRepository;
    }

    public async Task<IEnumerable<LocalizacaoDto>> ListarAsync()
    {
        var localizacoes = await _localizacaoRepository.ListarTodasAsync();
        return localizacoes.Select(l =>
            new LocalizacaoDto(l.Id, l.ArmazemId, l.Corredor, l.Prateleira, l.Nivel, l.Codigo));
    }

    public async Task<LocalizacaoDto> CriarAsync(CriarLocalizacaoDto dto)
    {
        // RN04: uma localização pertence a exatamente um armazém — o armazém precisa existir.
        var armazem = await _armazemRepository.ObterPorIdAsync(dto.ArmazemId);
        if (armazem is null)
        {
            throw new InvalidOperationException($"Armazém '{dto.ArmazemId}' não encontrado.");
        }

        var localizacoesDoArmazem = await _localizacaoRepository.ListarPorArmazemAsync(dto.ArmazemId);
        if (localizacoesDoArmazem.Any(l => l.Codigo.Equals(dto.Codigo, StringComparison.OrdinalIgnoreCase)))
        {
            throw new InvalidOperationException(
                $"Já existe uma localização com o código '{dto.Codigo}' neste armazém.");
        }

        var localizacao = new Localizacao
        {
            Id = Guid.NewGuid(),
            ArmazemId = dto.ArmazemId,
            Corredor = dto.Corredor,
            Prateleira = dto.Prateleira,
            Nivel = dto.Nivel,
            Codigo = dto.Codigo
        };

        await _localizacaoRepository.CriarAsync(localizacao);
        return new LocalizacaoDto(
            localizacao.Id, localizacao.ArmazemId, localizacao.Corredor,
            localizacao.Prateleira, localizacao.Nivel, localizacao.Codigo);
    }

    public async Task<LocalizacaoDto> AtualizarAsync(Guid id, AtualizarLocalizacaoDto dto)
    {
        var localizacao = await _localizacaoRepository.ObterPorIdAsync(id)
            ?? throw new NotFoundException("Localização", id);

        var localizacoesDoArmazem = await _localizacaoRepository.ListarPorArmazemAsync(localizacao.ArmazemId);
        if (localizacoesDoArmazem.Any(l => l.Id != id && l.Codigo.Equals(dto.Codigo, StringComparison.OrdinalIgnoreCase)))
        {
            throw new InvalidOperationException(
                $"Já existe outra localização com o código '{dto.Codigo}' neste armazém.");
        }

        localizacao.Corredor = dto.Corredor;
        localizacao.Prateleira = dto.Prateleira;
        localizacao.Nivel = dto.Nivel;
        localizacao.Codigo = dto.Codigo;

        await _localizacaoRepository.AtualizarAsync(localizacao);
        return new LocalizacaoDto(
            localizacao.Id, localizacao.ArmazemId, localizacao.Corredor,
            localizacao.Prateleira, localizacao.Nivel, localizacao.Codigo);
    }

    public async Task ExcluirAsync(Guid id)
    {
        _ = await _localizacaoRepository.ObterPorIdAsync(id) ?? throw new NotFoundException("Localização", id);

        if (await _localizacaoRepository.PossuiReferenciasAsync(id))
        {
            throw new InvalidOperationException(
                "Esta localização não pode ser excluída porque já tem estoque ou movimentações associadas.");
        }

        await _localizacaoRepository.ExcluirAsync(id);
    }
}
