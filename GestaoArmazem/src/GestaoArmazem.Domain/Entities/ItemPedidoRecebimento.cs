namespace GestaoArmazem.Domain.Entities;

public class ItemPedidoRecebimento
{
    public Guid Id { get; set; }
    public Guid PedidoRecebimentoId { get; set; }
    public Guid ProdutoId { get; set; }
    public int QuantidadeEsperada { get; set; }
    public int QuantidadeRecebida { get; set; }
}
