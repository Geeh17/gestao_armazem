using GestaoArmazem.Application.Interfaces;
using GestaoArmazem.Domain.Interfaces;
using GestaoArmazem.Infrastructure.Data;
using GestaoArmazem.Infrastructure.Repositories;
using GestaoArmazem.Infrastructure.Security;
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
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));

        // Scoped: uma instância de UnitOfWork/ISqlContext por requisição,
        // compartilhada por todos os repositórios daquela requisição.
        services.AddScoped<SqlUnitOfWork>();
        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<SqlUnitOfWork>());
        services.AddScoped<ISqlContext>(sp => sp.GetRequiredService<SqlUnitOfWork>());

        services.AddScoped<IProdutoRepository, ProdutoRepository>();
        services.AddScoped<IEstoqueRepository, EstoqueRepository>();
        services.AddScoped<IMovimentacaoEstoqueRepository, MovimentacaoEstoqueRepository>();
        services.AddScoped<ILocalizacaoRepository, LocalizacaoRepository>();
        services.AddScoped<IUsuarioRepository, UsuarioRepository>();
        services.AddScoped<IPerfilRepository, PerfilRepository>();
        services.AddScoped<IFornecedorRepository, FornecedorRepository>();
        services.AddScoped<IPedidoRecebimentoRepository, PedidoRecebimentoRepository>();

        services.AddScoped<IPasswordHasher, BCryptPasswordHasher>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

        return services;
    }
}
