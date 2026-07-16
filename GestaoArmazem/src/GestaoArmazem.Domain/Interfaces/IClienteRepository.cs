using GestaoArmazem.Domain.Entities;

namespace GestaoArmazem.Domain.Interfaces;

public interface IClienteRepository
{
    Task<Cliente?> ObterPorIdAsync(Guid id);
    Task<IEnumerable<Cliente>> ListarAsync();
    Task<Guid> CriarAsync(Cliente cliente);
}
