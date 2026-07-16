using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Interfaces;

public interface ILocalizacaoService
{
    Task<IEnumerable<LocalizacaoDto>> ListarAsync();
}
