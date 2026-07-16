namespace GestaoArmazem.Domain.Entities;

public class ItemPedidoExpedicao
{
    public Guid Id { get; set; }
    public Guid PedidoExpedicaoId { get; set; }
    public Guid ProdutoId { get; set; }
    public int QuantidadeSolicitada { get; set; }
    public int QuantidadeExpedida { get; set; }
}
