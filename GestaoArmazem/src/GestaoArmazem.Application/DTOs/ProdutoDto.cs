namespace GestaoArmazem.Application.DTOs;

public record ProdutoDto(
    Guid Id,
    string SKU,
    string Nome,
    string? Descricao,
    Guid CategoriaId,
    string UnidadeMedida,
    string? CodigoBarras,
    int EstoqueMinimo);

public record CriarProdutoDto(
    string SKU,
    string Nome,
    string? Descricao,
    Guid CategoriaId,
    string UnidadeMedida,
    string? CodigoBarras,
    int EstoqueMinimo);
