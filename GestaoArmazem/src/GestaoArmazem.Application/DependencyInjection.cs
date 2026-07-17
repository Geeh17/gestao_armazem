using FluentValidation;
using GestaoArmazem.Application.Interfaces;
using GestaoArmazem.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace GestaoArmazem.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IProdutoService, ProdutoService>();
        services.AddScoped<ICategoriaService, CategoriaService>();
        services.AddScoped<ILocalizacaoService, LocalizacaoService>();
        services.AddScoped<IRelatorioService, RelatorioService>();
        services.AddScoped<IEstoqueService, EstoqueService>();
        services.AddScoped<IMovimentacaoService, MovimentacaoService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IFornecedorService, FornecedorService>();
        services.AddScoped<IPedidoRecebimentoService, PedidoRecebimentoService>();
        services.AddScoped<IClienteService, ClienteService>();
        services.AddScoped<IPedidoExpedicaoService, PedidoExpedicaoService>();

        services.AddValidatorsFromAssemblyContaining(typeof(DependencyInjection));

        return services;
    }
}
