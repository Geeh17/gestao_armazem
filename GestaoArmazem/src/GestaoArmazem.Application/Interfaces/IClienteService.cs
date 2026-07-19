using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Interfaces;

public interface IClienteService
{
    Task<IEnumerable<ClienteDto>> ListarAsync();
    Task<ClienteDto> CriarAsync(CriarClienteDto dto);
    Task<ClienteDto> AtualizarAsync(Guid id, AtualizarClienteDto dto);
    Task ExcluirAsync(Guid id);
}
