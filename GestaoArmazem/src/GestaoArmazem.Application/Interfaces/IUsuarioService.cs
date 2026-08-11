using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Interfaces;

public interface IUsuarioService
{
    Task<IEnumerable<UsuarioDto>> ListarAsync();
    Task<UsuarioDto> CriarAsync(CriarUsuarioDto dto);
    Task<UsuarioDto> AtualizarAsync(Guid id, AtualizarUsuarioDto dto);
    Task ExcluirAsync(Guid id);
    Task AlterarSenhaAsync(Guid usuarioId, AlterarSenhaDto dto);

    /// <summary>Administrador redefine a senha de outro usuário (sem exigir a senha atual).</summary>
    Task ResetarSenhaAsync(Guid usuarioId, ResetarSenhaDto dto);
}
