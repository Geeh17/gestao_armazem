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
    public static void EnsureDatabaseUpToDate(string connectionString, bool logToConsole = true)
    {
        var builder = DeployChanges.To
            .SqlDatabase(connectionString)
            .WithScriptsEmbeddedInAssembly(Assembly.GetExecutingAssembly())
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
