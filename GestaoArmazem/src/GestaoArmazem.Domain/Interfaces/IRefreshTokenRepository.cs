using GestaoArmazem.Domain.Entities;

namespace GestaoArmazem.Domain.Interfaces;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> ObterPorTokenAsync(string token);
    Task CriarAsync(RefreshToken refreshToken);
    Task RevogarAsync(Guid id);
}
