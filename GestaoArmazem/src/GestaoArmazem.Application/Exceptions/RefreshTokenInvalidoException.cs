namespace GestaoArmazem.Application.Exceptions;

public class RefreshTokenInvalidoException : Exception
{
    public RefreshTokenInvalidoException()
        : base("Sessão expirada. Faça login novamente.")
    {
    }
}
