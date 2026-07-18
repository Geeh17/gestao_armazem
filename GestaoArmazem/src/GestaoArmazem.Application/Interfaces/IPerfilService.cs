using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Interfaces;

public interface IPerfilService
{
    Task<IEnumerable<PerfilDto>> ListarAsync();
    Task<PerfilDto> CriarAsync(CriarPerfilDto dto);
}
