namespace GestaoArmazem.Application.DTOs;

public record FornecedorDto(Guid Id, string Nome, string? CNPJ, string? Contato);

public record CriarFornecedorDto(string Nome, string? CNPJ, string? Contato);

public record AtualizarFornecedorDto(string Nome, string? CNPJ, string? Contato);
