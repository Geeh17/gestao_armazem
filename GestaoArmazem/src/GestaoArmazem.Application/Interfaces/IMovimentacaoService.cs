using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Interfaces;

public interface IMovimentacaoService
{
    Task RegistrarEntradaAsync(MovimentacaoEntradaDto dto);
    Task RegistrarSaidaAsync(MovimentacaoSaidaDto dto);
    Task RegistrarTransferenciaAsync(MovimentacaoTransferenciaDto dto);
}
