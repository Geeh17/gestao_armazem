using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Interfaces;

public interface IArmazemService
{
    Task<IEnumerable<ArmazemDto>> ListarAsync();
    Task<ArmazemDto> CriarAsync(CriarArmazemDto dto);
    Task<ArmazemDto> AtualizarAsync(Guid id, AtualizarArmazemDto dto);
    Task ExcluirAsync(Guid id);
}
