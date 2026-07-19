using GestaoArmazem.Domain.Entities;

namespace GestaoArmazem.Domain.Interfaces;

public interface ILocalizacaoRepository
{
    Task<Localizacao?> ObterPorIdAsync(Guid id);
    Task<IEnumerable<Localizacao>> ListarPorArmazemAsync(Guid armazemId);
    Task<IEnumerable<Localizacao>> ListarTodasAsync();
    Task<Guid> CriarAsync(Localizacao localizacao);
    Task AtualizarAsync(Localizacao localizacao);

    /// <summary>Indica se a localização está referenciada em estoque ou movimentações.</summary>
    Task<bool> PossuiReferenciasAsync(Guid id);
    Task ExcluirAsync(Guid id);
}
