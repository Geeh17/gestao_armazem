namespace GestaoArmazem.Application.DTOs;

public record LocalizacaoDto(
    Guid Id,
    Guid ArmazemId,
    string Corredor,
    string Prateleira,
    string Nivel,
    string Codigo);

public record CriarLocalizacaoDto(
    Guid ArmazemId,
    string Corredor,
    string Prateleira,
    string Nivel,
    string Codigo);

/// <summary>ArmazemId não é editável — mover uma localização de armazém é uma operação
/// distinta (envolveria mover o estoque físico); crie uma nova localização no lugar.</summary>
public record AtualizarLocalizacaoDto(string Corredor, string Prateleira, string Nivel, string Codigo);
