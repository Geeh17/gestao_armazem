namespace GestaoArmazem.Application.DTOs;

public record ItemPedidoRecebimentoInputDto(Guid ProdutoId, int QuantidadeEsperada);

public record CriarPedidoRecebimentoDto(
    Guid FornecedorId,
    DateTime DataPrevista,
    List<ItemPedidoRecebimentoInputDto> Itens);

public record ItemPedidoRecebimentoDto(
    Guid Id,
    Guid ProdutoId,
    int QuantidadeEsperada,
    int QuantidadeRecebida);

public record PedidoRecebimentoDto(
    Guid Id,
    Guid FornecedorId,
    string Status,
    DateTime DataPrevista,
    DateTime? DataRecebimento,
    List<ItemPedidoRecebimentoDto> Itens);

/// <summary>Confirma o recebimento (total ou parcial) de um item, dando entrada no estoque (UC01 + RF07).</summary>
public record ConfirmarRecebimentoItemDto(
    int QuantidadeRecebida,
    Guid LocalizacaoId,
    Guid UsuarioId);
