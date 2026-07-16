using System.Data;
using GestaoArmazem.Domain.Interfaces;

namespace GestaoArmazem.Infrastructure.Data;

/// <summary>
/// Implementa o controle transacional explícito exigido pelo Dapper.
/// Também implementa ISqlContext para compartilhar a conexão/transação
/// corrente com os repositórios (via DI Scoped).
/// </summary>
public class SqlUnitOfWork : IUnitOfWork, ISqlContext, IDisposable
{
    private readonly IDbConnectionFactory _connectionFactory;
    private IDbConnection? _connection;
    private IDbTransaction? _transaction;

    public SqlUnitOfWork(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public IDbConnection Connection
    {
        get
        {
            if (_connection is null)
            {
                _connection = _connectionFactory.CreateConnection();
                _connection.Open();
            }
            return _connection;
        }
    }

    public IDbTransaction? Transaction => _transaction;

    public Task IniciarTransacaoAsync()
    {
        _transaction = Connection.BeginTransaction();
        return Task.CompletedTask;
    }

    public Task ConfirmarAsync()
    {
        _transaction?.Commit();
        _transaction = null;
        return Task.CompletedTask;
    }

    public Task DesfazerAsync()
    {
        _transaction?.Rollback();
        _transaction = null;
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        _transaction?.Dispose();
        _connection?.Dispose();
    }
}
