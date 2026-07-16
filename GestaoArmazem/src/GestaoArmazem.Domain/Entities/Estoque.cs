namespace GestaoArmazem.Domain.Entities;

/// <summary>
/// Saldo de um produto em uma localização específica.
/// Chave composta: ProdutoId + LocalizacaoId.
/// RowVersion é usado para controle de concorrência otimista (RN01/RN08).
/// </summary>
public class Estoque
{
    public Guid ProdutoId { get; set; }
    public Guid LocalizacaoId { get; set; }
    public int Quantidade { get; set; }
    public byte[]? RowVersion { get; set; }
}
