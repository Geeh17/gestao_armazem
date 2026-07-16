namespace GestaoArmazem.Domain.Entities;

public class Localizacao
{
    public Guid Id { get; set; }
    public Guid ArmazemId { get; set; }
    public string Corredor { get; set; } = string.Empty;
    public string Prateleira { get; set; } = string.Empty;
    public string Nivel { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
}
