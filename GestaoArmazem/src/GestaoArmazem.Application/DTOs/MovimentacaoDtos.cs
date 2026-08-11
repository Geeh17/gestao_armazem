namespace GestaoArmazem.Application.DTOs;

public record MovimentacaoEntradaDto(
    Guid ProdutoId,
    Guid LocalizacaoId,
    int Quantidade,
    Guid UsuarioId);

public record MovimentacaoSaidaDto(
    Guid ProdutoId,
    Guid LocalizacaoId,
    int Quantidade,
    Guid UsuarioId);

public record MovimentacaoTransferenciaDto(
    Guid ProdutoId,
    Guid LocalizacaoOrigemId,
    Guid LocalizacaoDestinoId,
    int Quantidade,
    Guid UsuarioId);

/// <summary>Corrige o saldo para o valor exatamente contado (inventário físico) — não é um delta.</summary>
public record AjusteEstoqueDto(
    Guid ProdutoId,
    Guid LocalizacaoId,
    int QuantidadeContada,
    Guid UsuarioId);
