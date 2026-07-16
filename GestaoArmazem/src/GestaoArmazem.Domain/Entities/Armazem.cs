namespace GestaoArmazem.Domain.Entities;

public class Armazem
{
    public Guid Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Endereco { get; set; }
}
