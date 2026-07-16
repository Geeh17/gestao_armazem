using System.Data;

namespace GestaoArmazem.Infrastructure.Data;

/// <summary>
/// Expõe a conexão/transação corrente para os repositórios Dapper.
/// Registrado como Scoped no DI, compartilhado entre o UnitOfWork e os repositórios
/// dentro da mesma requisição — é assim que conseguimos transações entre repositórios
/// diferentes usando Dapper puro (sem DbContext).
/// </summary>
public interface ISqlContext
{
    IDbConnection Connection { get; }
    IDbTransaction? Transaction { get; }
}
