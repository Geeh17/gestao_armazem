namespace GestaoArmazem.Domain.Entities;

/// <summary>
/// Refresh token de sessão — permite renovar o access token JWT sem exigir novo login.
/// Rotação: cada uso revoga o token atual e emite um novo (evita reutilização de token roubado).
/// </summary>
public class RefreshToken
{
    public Guid Id { get; set; }
    public Guid UsuarioId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiraEm { get; set; }
    public bool Revogado { get; set; }
    public DateTime CriadoEm { get; set; }
}
