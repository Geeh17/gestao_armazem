namespace GestaoArmazem.Application.Exceptions;

/// <summary>
/// Lançada quando uma saída ou transferência resultaria em saldo negativo (RN01).
/// </summary>
public class SaldoInsuficienteException : Exception
{
    public SaldoInsuficienteException(Guid produtoId, Guid localizacaoId, int quantidadeSolicitada)
        : base($"Saldo insuficiente do produto {produtoId} na localização {localizacaoId} " +
               $"para a quantidade solicitada ({quantidadeSolicitada}).")
    {
    }
}
