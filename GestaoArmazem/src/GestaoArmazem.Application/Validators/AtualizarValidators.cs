using FluentValidation;
using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Validators;

public class AtualizarProdutoDtoValidator : AbstractValidator<AtualizarProdutoDto>
{
    public AtualizarProdutoDtoValidator()
    {
        RuleFor(p => p.Nome).NotEmpty().MaximumLength(200);
        RuleFor(p => p.UnidadeMedida).NotEmpty().MaximumLength(10);
        RuleFor(p => p.EstoqueMinimo).GreaterThanOrEqualTo(0);
    }
}

public class AtualizarFornecedorDtoValidator : AbstractValidator<AtualizarFornecedorDto>
{
    public AtualizarFornecedorDtoValidator()
    {
        RuleFor(f => f.Nome).NotEmpty().MaximumLength(200);
    }
}

public class AtualizarClienteDtoValidator : AbstractValidator<AtualizarClienteDto>
{
    public AtualizarClienteDtoValidator()
    {
        RuleFor(c => c.Nome).NotEmpty().MaximumLength(200);
    }
}

public class AtualizarArmazemDtoValidator : AbstractValidator<AtualizarArmazemDto>
{
    public AtualizarArmazemDtoValidator()
    {
        RuleFor(a => a.Nome).NotEmpty().MaximumLength(150);
    }
}

public class AtualizarLocalizacaoDtoValidator : AbstractValidator<AtualizarLocalizacaoDto>
{
    public AtualizarLocalizacaoDtoValidator()
    {
        RuleFor(l => l.Corredor).NotEmpty().MaximumLength(20);
        RuleFor(l => l.Prateleira).NotEmpty().MaximumLength(20);
        RuleFor(l => l.Nivel).NotEmpty().MaximumLength(20);
        RuleFor(l => l.Codigo).NotEmpty().MaximumLength(50);
    }
}
