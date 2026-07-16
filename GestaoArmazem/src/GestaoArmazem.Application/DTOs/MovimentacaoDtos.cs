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
