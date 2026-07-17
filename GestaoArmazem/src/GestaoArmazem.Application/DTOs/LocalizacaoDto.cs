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
