namespace GestaoArmazem.Application.Exceptions;

public class NotFoundException : Exception
{
    public NotFoundException(string entidade, object chave)
        : base($"{entidade} '{chave}' não foi encontrado(a).")
    {
    }
}
