using GestaoArmazem.Domain.Enums;

namespace GestaoArmazem.Domain.Entities;

public class PedidoRecebimento
{
    public Guid Id { get; set; }
    public Guid FornecedorId { get; set; }
    public StatusPedido Status { get; set; } = StatusPedido.Pendente;
    public DateTime DataPrevista { get; set; }
    public DateTime? DataRecebimento { get; set; }
}
