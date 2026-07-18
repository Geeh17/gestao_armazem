namespace GestaoArmazem.Application.DTOs;

public record PerfilDto(Guid Id, string Nome);

public record CriarPerfilDto(string Nome);
