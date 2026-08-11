using FluentValidation;
using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Validators;

public class CriarCategoriaDtoValidator : AbstractValidator<CriarCategoriaDto>
{
    public CriarCategoriaDtoValidator()
    {
        RuleFor(c => c.Nome).NotEmpty().MaximumLength(100);
    }
}

public class AtualizarCategoriaDtoValidator : AbstractValidator<AtualizarCategoriaDto>
{
    public AtualizarCategoriaDtoValidator()
    {
        RuleFor(c => c.Nome).NotEmpty().MaximumLength(100);
    }
}
