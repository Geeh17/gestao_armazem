namespace GestaoArmazem.Application.DTOs;

public record EstoqueBaixoDto(Guid ProdutoId, string Sku, string Nome, int SaldoTotal, int EstoqueMinimo);

public record MovimentacaoRelatorioDto(
    Guid Id,
    Guid ProdutoId,
    Guid? LocalizacaoOrigemId,
    Guid? LocalizacaoDestinoId,
    int Quantidade,
    string Tipo,
    DateTime Data,
    Guid UsuarioId);
