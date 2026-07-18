using FluentValidation;
using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Validators;

public class CriarPerfilDtoValidator : AbstractValidator<CriarPerfilDto>
{
    public CriarPerfilDtoValidator()
    {
        RuleFor(p => p.Nome).NotEmpty().MaximumLength(50);
    }
}

public class CriarUsuarioDtoValidator : AbstractValidator<CriarUsuarioDto>
{
    public CriarUsuarioDtoValidator()
    {
        RuleFor(u => u.Nome).NotEmpty().MaximumLength(150);
        RuleFor(u => u.Email).NotEmpty().EmailAddress().MaximumLength(200);
        RuleFor(u => u.Senha).NotEmpty().MinimumLength(8)
            .WithMessage("A senha deve ter ao menos 8 caracteres.");
        RuleFor(u => u.PerfilId).NotEmpty();
    }
}

public class AlterarSenhaDtoValidator : AbstractValidator<AlterarSenhaDto>
{
    public AlterarSenhaDtoValidator()
    {
        RuleFor(a => a.SenhaAtual).NotEmpty();
        RuleFor(a => a.NovaSenha).NotEmpty().MinimumLength(8)
            .WithMessage("A nova senha deve ter ao menos 8 caracteres.");
        RuleFor(a => a)
            .Must(a => a.SenhaAtual != a.NovaSenha)
            .WithMessage("A nova senha deve ser diferente da senha atual.");
    }
}
