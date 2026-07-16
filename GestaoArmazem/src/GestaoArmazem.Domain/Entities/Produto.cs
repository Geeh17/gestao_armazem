namespace GestaoArmazem.Domain.Entities;

public class Produto
{
    public Guid Id { get; set; }
    public string SKU { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public Guid CategoriaId { get; set; }
    public string UnidadeMedida { get; set; } = "UN";
    public string? CodigoBarras { get; set; }
    public int EstoqueMinimo { get; set; }
}
