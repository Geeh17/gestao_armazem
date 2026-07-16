using FluentValidation;
using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Validators;

public class CriarProdutoDtoValidator : AbstractValidator<CriarProdutoDto>
{
    public CriarProdutoDtoValidator()
    {
        RuleFor(p => p.SKU)
            .NotEmpty().WithMessage("O SKU é obrigatório.")
            .MaximumLength(50);

        RuleFor(p => p.Nome)
            .NotEmpty().WithMessage("O nome do produto é obrigatório.")
            .MaximumLength(200);

        RuleFor(p => p.UnidadeMedida)
            .NotEmpty().WithMessage("A unidade de medida é obrigatória.")
            .MaximumLength(10);

        RuleFor(p => p.EstoqueMinimo)
            .GreaterThanOrEqualTo(0).WithMessage("O estoque mínimo não pode ser negativo.");
    }
}
