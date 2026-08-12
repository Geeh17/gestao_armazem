using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Interfaces;

public interface IAuthService
{
    Task<TokenResponseDto> LoginAsync(LoginDto dto);

    /// <summary>Renova o access token usando um refresh token válido. Rotação: o token usado é revogado.</summary>
    Task<TokenResponseDto> RefreshAsync(RefreshTokenRequestDto dto);

    /// <summary>Revoga o refresh token — encerra a sessão nesse dispositivo.</summary>
    Task LogoutAsync(RefreshTokenRequestDto dto);
}
