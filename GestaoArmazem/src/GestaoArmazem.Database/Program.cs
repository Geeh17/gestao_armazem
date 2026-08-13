using GestaoArmazem.Database;

// Uso:
//   dotnet run --project src/GestaoArmazem.Database -- "<connection string>" [--seed]
// Ou, sem argumento de connection string, usa a variável de ambiente GESTAOARMAZEM_CONNECTION.
//
// Por padrão NÃO aplica os scripts de seed (dados de exemplo, incluindo o usuário
// admin@gestaoarmazem.local com senha conhecida) — só schema. Passe --seed
// explicitamente para incluir o seed (uso local/desenvolvimento). Isso evita que
// alguém rode esse comando contra um banco de produção e crie sem querer um
// usuário administrador com senha pública/documentada.
var argsPosicionais = args.Where(a => a != "--seed").ToArray();
var aplicarSeed = args.Contains("--seed");

var connectionString = argsPosicionais.Length > 0
    ? argsPosicionais[0]
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

    Console.WriteLine(aplicarSeed
        ? "Aplicando scripts pendentes (incluindo seed)..."
        : "Aplicando scripts pendentes (seed NÃO incluído — use --seed para incluir)...");
    DatabaseMigrator.EnsureDatabaseUpToDate(connectionString, aplicarSeed: aplicarSeed);

    Console.WriteLine("Banco de dados atualizado com sucesso.");
    return 0;
}
catch (Exception ex)
{
    Console.Error.WriteLine($"Erro ao atualizar o banco de dados: {ex.Message}");
    return 1;
}
