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

/// <summary>SKU não é editável — é o identificador estável do produto (RN03).</summary>
public record AtualizarProdutoDto(
    string Nome,
    string? Descricao,
    Guid CategoriaId,
    string UnidadeMedida,
    string? CodigoBarras,
    int EstoqueMinimo);
