using FluentValidation;
using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Validators;

public class MovimentacaoEntradaDtoValidator : AbstractValidator<MovimentacaoEntradaDto>
{
    public MovimentacaoEntradaDtoValidator()
    {
        RuleFor(m => m.ProdutoId).NotEmpty();
        RuleFor(m => m.LocalizacaoId).NotEmpty();
        RuleFor(m => m.Quantidade).GreaterThan(0).WithMessage("A quantidade deve ser maior que zero.");
    }
}

public class MovimentacaoSaidaDtoValidator : AbstractValidator<MovimentacaoSaidaDto>
{
    public MovimentacaoSaidaDtoValidator()
    {
        RuleFor(m => m.ProdutoId).NotEmpty();
        RuleFor(m => m.LocalizacaoId).NotEmpty();
        RuleFor(m => m.Quantidade).GreaterThan(0).WithMessage("A quantidade deve ser maior que zero.");
    }
}

public class MovimentacaoTransferenciaDtoValidator : AbstractValidator<MovimentacaoTransferenciaDto>
{
    public MovimentacaoTransferenciaDtoValidator()
    {
        RuleFor(m => m.ProdutoId).NotEmpty();
        RuleFor(m => m.LocalizacaoOrigemId).NotEmpty();
        RuleFor(m => m.LocalizacaoDestinoId).NotEmpty();
        RuleFor(m => m.Quantidade).GreaterThan(0).WithMessage("A quantidade deve ser maior que zero.");
        RuleFor(m => m)
            .Must(m => m.LocalizacaoOrigemId != m.LocalizacaoDestinoId)
            .WithMessage("A localização de origem deve ser diferente da localização de destino.");
    }
}

public class AjusteEstoqueDtoValidator : AbstractValidator<AjusteEstoqueDto>
{
    public AjusteEstoqueDtoValidator()
    {
        RuleFor(a => a.ProdutoId).NotEmpty();
        RuleFor(a => a.LocalizacaoId).NotEmpty();
        RuleFor(a => a.QuantidadeContada).GreaterThanOrEqualTo(0)
            .WithMessage("A quantidade contada não pode ser negativa.");
        RuleFor(a => a.Motivo).MaximumLength(300);
    }
}
