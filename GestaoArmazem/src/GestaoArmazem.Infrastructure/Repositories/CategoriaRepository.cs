using Dapper;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;
using GestaoArmazem.Infrastructure.Data;

namespace GestaoArmazem.Infrastructure.Repositories;

public class CategoriaRepository : ICategoriaRepository
{
    private readonly ISqlContext _sql;

    public CategoriaRepository(ISqlContext sql)
    {
        _sql = sql;
    }

    public Task<IEnumerable<Categoria>> ListarAsync() =>
        _sql.Connection.QueryAsync<Categoria>(
            "SELECT * FROM Categoria ORDER BY Nome", transaction: _sql.Transaction);
}
