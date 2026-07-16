using FluentValidation;
using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Validators;

public class CriarPedidoExpedicaoDtoValidator : AbstractValidator<CriarPedidoExpedicaoDto>
{
    public CriarPedidoExpedicaoDtoValidator()
    {
        RuleFor(p => p.ClienteId).NotEmpty();
        RuleFor(p => p.DataPrevista).NotEmpty();
        RuleFor(p => p.Itens)
            .NotEmpty().WithMessage("O pedido deve conter ao menos um item.");

        RuleForEach(p => p.Itens).ChildRules(item =>
        {
            item.RuleFor(i => i.ProdutoId).NotEmpty();
            item.RuleFor(i => i.QuantidadeSolicitada).GreaterThan(0);
        });
    }
}

public class ExpedirPedidoDtoValidator : AbstractValidator<ExpedirPedidoDto>
{
    public ExpedirPedidoDtoValidator()
    {
        RuleFor(e => e.UsuarioId).NotEmpty();
        RuleFor(e => e.Itens).NotEmpty().WithMessage("Informe a localização de origem de cada item.");

        RuleForEach(e => e.Itens).ChildRules(item =>
        {
            item.RuleFor(i => i.ItemId).NotEmpty();
            item.RuleFor(i => i.LocalizacaoId).NotEmpty();
        });
    }
}

public class CriarClienteDtoValidator : AbstractValidator<CriarClienteDto>
{
    public CriarClienteDtoValidator()
    {
        RuleFor(c => c.Nome).NotEmpty().MaximumLength(200);
    }
}
