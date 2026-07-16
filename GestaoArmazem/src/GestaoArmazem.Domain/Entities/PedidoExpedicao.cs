using GestaoArmazem.Domain.Enums;

namespace GestaoArmazem.Domain.Entities;

public class PedidoExpedicao
{
    public Guid Id { get; set; }
    public Guid ClienteId { get; set; }
    public StatusPedido Status { get; set; } = StatusPedido.Pendente;
    public DateTime DataPrevista { get; set; }
    public DateTime? DataExpedicao { get; set; }
}
