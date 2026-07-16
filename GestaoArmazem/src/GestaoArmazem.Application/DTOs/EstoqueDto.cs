namespace GestaoArmazem.Application.DTOs;

public record EstoqueDto(
    Guid ProdutoId,
    Guid LocalizacaoId,
    int Quantidade);
