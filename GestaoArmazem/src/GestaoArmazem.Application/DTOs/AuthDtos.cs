namespace GestaoArmazem.Application.DTOs;

public record LoginDto(string Email, string Senha);

public record TokenResponseDto(string Token, DateTime ExpiraEm);
