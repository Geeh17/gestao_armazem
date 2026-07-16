namespace GestaoArmazem.Domain.Interfaces;

/// <summary>
/// Como o Dapper não gerencia transações automaticamente, o IUnitOfWork
/// expõe o controle explícito usado pelos serviços da Application
/// (por exemplo, em transferências de estoque — RN08).
/// </summary>
public interface IUnitOfWork
{
    Task IniciarTransacaoAsync();
    Task ConfirmarAsync();
    Task DesfazerAsync();
}
