using GestaoArmazem.Domain.Entities;

namespace GestaoArmazem.Application.Interfaces;

/// <summary>
/// Gera o token JWT para um usuário autenticado.
/// Implementado na Infrastructure (depende de configuração e bibliotecas de JWT).
/// </summary>
public interface IJwtTokenGenerator
{
    (string Token, DateTime ExpiraEm) GerarToken(Usuario usuario, string nomePerfil);

    /// <summary>Gera uma string aleatória segura para usar como refresh token, com sua data de expiração.</summary>
    (string Token, DateTime ExpiraEm) GerarRefreshToken();
}

/// <summary>
/// Verifica e gera hashes de senha (BCrypt na implementação da Infrastructure).
/// </summary>
public interface IPasswordHasher
{
    string Hash(string senha);
    bool Verificar(string senha, string hash);
}
