using GestaoArmazem.Database;

// Uso:
//   dotnet run --project src/GestaoArmazem.Database -- "<connection string>"
// Ou, sem argumento, usa a variável de ambiente GESTAOARMAZEM_CONNECTION.
var connectionString = args.Length > 0
    ? args[0]
    : Environment.GetEnvironmentVariable("GESTAOARMAZEM_CONNECTION");

if (string.IsNullOrWhiteSpace(connectionString))
{
    Console.Error.WriteLine(
        "Informe a connection string como argumento ou defina a variável de ambiente GESTAOARMAZEM_CONNECTION.");
    return 1;
}

try
{
    Console.WriteLine("Verificando se o banco de dados existe...");
    DatabaseMigrator.EnsureDatabaseCreated(connectionString);

    Console.WriteLine("Aplicando scripts pendentes...");
    DatabaseMigrator.EnsureDatabaseUpToDate(connectionString);

    Console.WriteLine("Banco de dados atualizado com sucesso.");
    return 0;
}
catch (Exception ex)
{
    Console.Error.WriteLine($"Erro ao atualizar o banco de dados: {ex.Message}");
    return 1;
}
