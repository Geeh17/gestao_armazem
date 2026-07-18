using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Interfaces;

public interface IUsuarioService
{
    Task<IEnumerable<UsuarioDto>> ListarAsync();
    Task<UsuarioDto> CriarAsync(CriarUsuarioDto dto);
    Task AlterarSenhaAsync(Guid usuarioId, AlterarSenhaDto dto);
}
