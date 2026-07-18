namespace GestaoArmazem.Application.DTOs;

public record UsuarioDto(Guid Id, string Nome, string Email, Guid PerfilId, string PerfilNome);

public record CriarUsuarioDto(string Nome, string Email, string Senha, Guid PerfilId);

public record AlterarSenhaDto(string SenhaAtual, string NovaSenha);
