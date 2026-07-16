namespace GestaoArmazem.Domain.Entities;

public class Fornecedor
{
    public Guid Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? CNPJ { get; set; }
    public string? Contato { get; set; }
}
