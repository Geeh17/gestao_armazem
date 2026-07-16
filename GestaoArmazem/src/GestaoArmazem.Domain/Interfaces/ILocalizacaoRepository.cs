using GestaoArmazem.Domain.Entities;

namespace GestaoArmazem.Domain.Interfaces;

public interface ILocalizacaoRepository
{
    Task<Localizacao?> ObterPorIdAsync(Guid id);
    Task<IEnumerable<Localizacao>> ListarPorArmazemAsync(Guid armazemId);
    Task<IEnumerable<Localizacao>> ListarTodasAsync();
    Task<Guid> CriarAsync(Localizacao localizacao);
}
