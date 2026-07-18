using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Interfaces;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;

namespace GestaoArmazem.Application.Services;

public class PerfilService : IPerfilService
{
    private readonly IPerfilRepository _perfilRepository;

    public PerfilService(IPerfilRepository perfilRepository)
    {
        _perfilRepository = perfilRepository;
    }

    public async Task<IEnumerable<PerfilDto>> ListarAsync()
    {
        var perfis = await _perfilRepository.ListarAsync();
        return perfis.Select(p => new PerfilDto(p.Id, p.Nome));
    }

    public async Task<PerfilDto> CriarAsync(CriarPerfilDto dto)
    {
        var perfil = new Perfil { Id = Guid.NewGuid(), Nome = dto.Nome };
        await _perfilRepository.CriarAsync(perfil);
        return new PerfilDto(perfil.Id, perfil.Nome);
    }
}
