namespace GestaoArmazem.Application.DTOs;

public record CategoriaDto(Guid Id, string Nome);

public record CriarCategoriaDto(string Nome);

public record AtualizarCategoriaDto(string Nome);
