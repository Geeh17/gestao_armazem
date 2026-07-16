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
        services.AddScoped<IEstoqueService, EstoqueService>();
        services.AddScoped<IMovimentacaoService, MovimentacaoService>();
        services.AddScoped<IAuthService, AuthService>();

        services.AddValidatorsFromAssemblyContaining(typeof(DependencyInjection));

        return services;
    }
}
