namespace GestaoArmazem.Application.DTOs;

public record ArmazemDto(Guid Id, string Nome, string? Endereco);

public record CriarArmazemDto(string Nome, string? Endereco);

public record AtualizarArmazemDto(string Nome, string? Endereco);
