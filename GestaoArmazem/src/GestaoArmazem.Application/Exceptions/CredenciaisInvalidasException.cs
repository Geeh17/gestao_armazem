namespace GestaoArmazem.Application.Exceptions;

public class CredenciaisInvalidasException : Exception
{
    public CredenciaisInvalidasException()
        : base("Email ou senha inválidos.")
    {
    }
}
