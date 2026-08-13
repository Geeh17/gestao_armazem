using GestaoArmazem.Database;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace GestaoArmazem.IntegrationTests;

/// <summary>
/// Cria um banco de dados de teste (GestaoArmazem_IntegrationTests) na mesma instância
/// de SQL Server local que você já usa para rodar a API, aplica os scripts via DbUp,
/// e expõe uma WebApplicationFactory apontando para esse banco. É apagado ao final da
/// suíte, então cada execução começa do zero.
///
/// Não depende de Docker/Testcontainers — usa a instância local (.\SQLEXPRESS por padrão).
/// Se a sua instância tiver outro nome, defina a variável de ambiente
/// GESTAOARMAZEM_TEST_CONNECTION com a connection string completa antes de rodar os testes.
/// </summary>
public class IntegrationTestFixture : IAsyncLifetime
{
    private const string NomeBancoTeste = "GestaoArmazem_IntegrationTests";

    private static readonly string MasterConnectionString =
        Environment.GetEnvironmentVariable("GESTAOARMAZEM_TEST_CONNECTION")
        ?? @"Server=.\SQLEXPRESS;Database=master;Trusted_Connection=True;TrustServerCertificate=True;";

    public WebApplicationFactory<Program> Factory { get; private set; } = null!;

    public string ConnectionString =>
        MasterConnectionString.Replace("Database=master", $"Database={NomeBancoTeste}");

    public async Task InitializeAsync()
    {
        // Garante um banco de teste limpo, mesmo que uma execução anterior tenha
        // sido interrompida antes do DisposeAsync.
        await ExcluirBancoDeTesteSeExistirAsync();

        DatabaseMigrator.EnsureDatabaseCreated(ConnectionString);
        DatabaseMigrator.EnsureDatabaseUpToDate(ConnectionString, logToConsole: false);

        Factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("Database:AutoMigrate", "false"); // já aplicamos acima
            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["ConnectionStrings:GestaoArmazem"] = ConnectionString
                });
            });
        });
    }

    public async Task DisposeAsync()
    {
        await Factory.DisposeAsync();
        await ExcluirBancoDeTesteSeExistirAsync();
    }

    private static async Task ExcluirBancoDeTesteSeExistirAsync()
    {
        await using var connection = new SqlConnection(MasterConnectionString);
        await connection.OpenAsync();

        var sql = $@"
            IF EXISTS (SELECT 1 FROM sys.databases WHERE name = '{NomeBancoTeste}')
            BEGIN
                ALTER DATABASE [{NomeBancoTeste}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
                DROP DATABASE [{NomeBancoTeste}];
            END";

        await using var command = new SqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync();
    }
}
