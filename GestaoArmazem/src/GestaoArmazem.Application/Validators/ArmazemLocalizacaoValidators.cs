using FluentValidation;
using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Validators;

public class CriarArmazemDtoValidator : AbstractValidator<CriarArmazemDto>
{
    public CriarArmazemDtoValidator()
    {
        RuleFor(a => a.Nome).NotEmpty().MaximumLength(150);
    }
}

public class CriarLocalizacaoDtoValidator : AbstractValidator<CriarLocalizacaoDto>
{
    public CriarLocalizacaoDtoValidator()
    {
        RuleFor(l => l.ArmazemId).NotEmpty();
        RuleFor(l => l.Corredor).NotEmpty().MaximumLength(20);
        RuleFor(l => l.Prateleira).NotEmpty().MaximumLength(20);
        RuleFor(l => l.Nivel).NotEmpty().MaximumLength(20);
        RuleFor(l => l.Codigo).NotEmpty().MaximumLength(50);
    }
}
