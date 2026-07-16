namespace GestaoArmazem.Application.DTOs;

public record ItemPedidoExpedicaoInputDto(Guid ProdutoId, int QuantidadeSolicitada);

public record CriarPedidoExpedicaoDto(
    Guid ClienteId,
    DateTime DataPrevista,
    List<ItemPedidoExpedicaoInputDto> Itens);

public record ItemPedidoExpedicaoDto(
    Guid Id,
    Guid ProdutoId,
    int QuantidadeSolicitada,
    int QuantidadeExpedida);

public record PedidoExpedicaoDto(
    Guid Id,
    Guid ClienteId,
    string Status,
    DateTime DataPrevista,
    DateTime? DataExpedicao,
    List<ItemPedidoExpedicaoDto> Itens);

/// <summary>De qual localização retirar cada item na expedição.</summary>
public record ItemExpedicaoLocalizacaoDto(Guid ItemId, Guid LocalizacaoId);

/// <summary>
/// Expede o pedido inteiro de uma vez (RN06: tudo ou nada — se faltar saldo de
/// qualquer item, nenhum item é baixado do estoque).
/// </summary>
public record ExpedirPedidoDto(List<ItemExpedicaoLocalizacaoDto> Itens, Guid UsuarioId);
