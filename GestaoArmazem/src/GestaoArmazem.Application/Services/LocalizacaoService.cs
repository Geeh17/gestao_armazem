using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Interfaces;
using GestaoArmazem.Domain.Interfaces;

namespace GestaoArmazem.Application.Services;

public class LocalizacaoService : ILocalizacaoService
{
    private readonly ILocalizacaoRepository _localizacaoRepository;

    public LocalizacaoService(ILocalizacaoRepository localizacaoRepository)
    {
        _localizacaoRepository = localizacaoRepository;
    }

    public async Task<IEnumerable<LocalizacaoDto>> ListarAsync()
    {
        var localizacoes = await _localizacaoRepository.ListarTodasAsync();
        return localizacoes.Select(l =>
            new LocalizacaoDto(l.Id, l.ArmazemId, l.Corredor, l.Prateleira, l.Nivel, l.Codigo));
    }
}
