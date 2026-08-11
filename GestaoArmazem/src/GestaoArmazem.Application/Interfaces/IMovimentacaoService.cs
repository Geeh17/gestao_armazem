using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Interfaces;

public interface IMovimentacaoService
{
    Task RegistrarEntradaAsync(MovimentacaoEntradaDto dto);
    Task RegistrarSaidaAsync(MovimentacaoSaidaDto dto);
    Task RegistrarTransferenciaAsync(MovimentacaoTransferenciaDto dto);

    /// <summary>Corrige o saldo para o valor contado numa conferência de inventário.</summary>
    Task RegistrarAjusteAsync(AjusteEstoqueDto dto);
}
