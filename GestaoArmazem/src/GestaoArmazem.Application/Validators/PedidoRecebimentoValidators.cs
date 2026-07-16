using FluentValidation;
using GestaoArmazem.Application.DTOs;

namespace GestaoArmazem.Application.Validators;

public class CriarPedidoRecebimentoDtoValidator : AbstractValidator<CriarPedidoRecebimentoDto>
{
    public CriarPedidoRecebimentoDtoValidator()
    {
        RuleFor(p => p.FornecedorId).NotEmpty();
        RuleFor(p => p.DataPrevista).NotEmpty();
        RuleFor(p => p.Itens)
            .NotEmpty().WithMessage("O pedido deve conter ao menos um item.");

        RuleForEach(p => p.Itens).ChildRules(item =>
        {
            item.RuleFor(i => i.ProdutoId).NotEmpty();
            item.RuleFor(i => i.QuantidadeEsperada).GreaterThan(0);
        });
    }
}

public class ConfirmarRecebimentoItemDtoValidator : AbstractValidator<ConfirmarRecebimentoItemDto>
{
    public ConfirmarRecebimentoItemDtoValidator()
    {
        RuleFor(c => c.QuantidadeRecebida).GreaterThan(0);
        RuleFor(c => c.LocalizacaoId).NotEmpty();
        RuleFor(c => c.UsuarioId).NotEmpty();
    }
}

public class CriarFornecedorDtoValidator : AbstractValidator<CriarFornecedorDto>
{
    public CriarFornecedorDtoValidator()
    {
        RuleFor(f => f.Nome).NotEmpty().MaximumLength(200);
    }
}
