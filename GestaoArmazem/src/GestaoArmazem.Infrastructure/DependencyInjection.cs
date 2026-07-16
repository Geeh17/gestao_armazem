using GestaoArmazem.Domain.Interfaces;
using GestaoArmazem.Infrastructure.Data;
using GestaoArmazem.Infrastructure.Repositories;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace GestaoArmazem.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("GestaoArmazem")
            ?? throw new InvalidOperationException("Connection string 'GestaoArmazem' não configurada.");

        services.AddSingleton<IDbConnectionFactory>(new SqlConnectionFactory(connectionString));

        // Scoped: uma instância de UnitOfWork/ISqlContext por requisição,
        // compartilhada por todos os repositórios daquela requisição.
        services.AddScoped<SqlUnitOfWork>();
        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<SqlUnitOfWork>());
        services.AddScoped<ISqlContext>(sp => sp.GetRequiredService<SqlUnitOfWork>());

        services.AddScoped<IProdutoRepository, ProdutoRepository>();
        services.AddScoped<IEstoqueRepository, EstoqueRepository>();
        services.AddScoped<IMovimentacaoEstoqueRepository, MovimentacaoEstoqueRepository>();
        services.AddScoped<ILocalizacaoRepository, LocalizacaoRepository>();

        return services;
    }
}
