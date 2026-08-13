using System.Reflection;
using DbUp;
using DbUp.Engine;

namespace GestaoArmazem.Database;

/// <summary>
/// Aplica os scripts SQL pendentes (src/database/scripts, embutidos como recursos)
/// contra o banco informado. Idempotente: o DbUp registra em uma tabela própria
/// (SchemaVersions) quais scripts já foram executados e só roda os novos, em ordem.
/// </summary>
public static class DatabaseMigrator
{
    /// <summary>
    /// Aplica os scripts pendentes. Lança InvalidOperationException se algum script falhar.
    /// </summary>
    /// <param name="aplicarSeed">
    /// Controla se scripts de dados de exemplo/seed (nome contendo "SeedData") são aplicados.
    /// Default true por compatibilidade com o uso local/Development de sempre — mas o CLI
    /// (Program.cs deste projeto) passa false por padrão, exigindo a flag --seed explícita,
    /// justamente para não criar sem querer o usuário admin com senha conhecida
    /// (admin@gestaoarmazem.local / Admin@123) num banco de produção.
    /// </param>
    public static void EnsureDatabaseUpToDate(
        string connectionString, bool logToConsole = true, bool aplicarSeed = true)
    {
        var assembly = Assembly.GetExecutingAssembly();

        var builder = DeployChanges.To
            .SqlDatabase(connectionString)
            .WithScriptsEmbeddedInAssembly(
                assembly,
                nomeRecurso => aplicarSeed || !nomeRecurso.Contains("SeedData", StringComparison.OrdinalIgnoreCase))
            .JournalToSqlTable("dbo", "SchemaVersions")
            .WithTransactionPerScript()
            // Desliga a substituição de variáveis ($nome$) do DbUp: não usamos esse
            // recurso, e hashes bcrypt (ex.: $2b$11$...) no seed são interpretados
            // erroneamente como variáveis, quebrando o script com
            // "Variable 2b has no value defined".
            .WithVariablesDisabled();

        if (logToConsole)
        {
            builder = builder.LogToConsole();
        }

        var upgrader = builder.Build();
        DatabaseUpgradeResult result = upgrader.PerformUpgrade();

        if (!result.Successful)
        {
            throw new InvalidOperationException(
                $"Falha ao aplicar os scripts do banco de dados: {result.Error?.Message}", result.Error);
        }
    }

    /// <summary>Cria o banco de dados informado na connection string, caso ainda não exista.</summary>
    public static void EnsureDatabaseCreated(string connectionString)
    {
        EnsureDatabase.For.SqlDatabase(connectionString);
    }
}
