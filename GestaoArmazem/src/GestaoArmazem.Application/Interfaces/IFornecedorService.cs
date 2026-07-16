using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Interfaces;

public interface IFornecedorService
{
    Task<IEnumerable<FornecedorDto>> ListarAsync();
    Task<FornecedorDto> CriarAsync(CriarFornecedorDto dto);
}
