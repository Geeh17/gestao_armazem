namespace GestaoArmazem.Application.DTOs;

public record ClienteDto(Guid Id, string Nome, string? Documento, string? Contato);

public record CriarClienteDto(string Nome, string? Documento, string? Contato);

public record AtualizarClienteDto(string Nome, string? Documento, string? Contato);
