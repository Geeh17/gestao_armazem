using GestaoArmazem.Domain.Entities;

namespace GestaoArmazem.Domain.Interfaces;

public interface IClienteRepository
{
    Task<Cliente?> ObterPorIdAsync(Guid id);
    Task<IEnumerable<Cliente>> ListarAsync();
    Task<Guid> CriarAsync(Cliente cliente);
    Task AtualizarAsync(Cliente cliente);

    /// <summary>Indica se o cliente está referenciado em algum pedido de expedição.</summary>
    Task<bool> PossuiReferenciasAsync(Guid id);
    Task ExcluirAsync(Guid id);
}
