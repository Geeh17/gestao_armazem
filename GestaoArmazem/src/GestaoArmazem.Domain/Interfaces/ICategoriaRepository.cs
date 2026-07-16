using GestaoArmazem.Domain.Entities;

namespace GestaoArmazem.Domain.Interfaces;

public interface ICategoriaRepository
{
    Task<IEnumerable<Categoria>> ListarAsync();
}
