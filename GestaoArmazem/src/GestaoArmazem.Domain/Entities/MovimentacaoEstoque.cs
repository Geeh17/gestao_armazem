using GestaoArmazem.Domain.Enums;

namespace GestaoArmazem.Domain.Entities;

/// <summary>
/// Log auditável de movimentações de estoque (RN02).
/// Somente inserção — nunca é editado ou excluído.
/// </summary>
public class MovimentacaoEstoque
{
    public Guid Id { get; set; }
    public Guid ProdutoId { get; set; }
    public Guid? LocalizacaoOrigemId { get; set; }
    public Guid? LocalizacaoDestinoId { get; set; }
    public int Quantidade { get; set; }
    public TipoMovimentacao Tipo { get; set; }
    public DateTime Data { get; set; }
    public Guid UsuarioId { get; set; }
}
