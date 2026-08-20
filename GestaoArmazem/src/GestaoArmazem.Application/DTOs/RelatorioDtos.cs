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

public record PedidoRecebimentoRelatorioDto(
    Guid Id,
    Guid FornecedorId,
    string FornecedorNome,
    string Status,
    DateTime DataPrevista,
    DateTime? DataRecebimento,
    int QuantidadeItens);

public record PedidoExpedicaoRelatorioDto(
    Guid Id,
    Guid ClienteId,
    string ClienteNome,
    string Status,
    DateTime DataPrevista,
    DateTime? DataExpedicao,
    int QuantidadeItens);
