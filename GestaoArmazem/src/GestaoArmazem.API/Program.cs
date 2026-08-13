using System.Text;
using System.Threading.RateLimiting;
using GestaoArmazem.API.HealthChecks;
using GestaoArmazem.API.Middleware;
using GestaoArmazem.Application;
using GestaoArmazem.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Logging estruturado (console + arquivo com rotação diária), configurado via
// appsettings.json (seção "Serilog"). Substitui o logger padrão do ASP.NET Core.
builder.Host.UseSerilog((context, configuration) =>
    configuration.ReadFrom.Configuration(context.Configuration));

// Camadas da aplicação (Clean Architecture)
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// Autenticação JWT (RF10)
var jwtSettings = builder.Configuration.GetSection("Jwt");

// Fail-fast: recusa subir fora de Development se a SecretKey continuar sendo o
// placeholder do appsettings.json (ou for curta demais). Sem essa checagem, a API
// subiria "funcionando" com uma chave pública/conhecida, e qualquer um poderia
// forjar tokens JWT válidos — um erro de configuração silencioso e grave.
if (!builder.Environment.IsDevelopment())
{
    var secretKey = jwtSettings["SecretKey"];
    const string placeholder = "__SUBSTITUA_POR_UM_SEGREDO_FORTE_EM_PRODUCAO__";

    if (string.IsNullOrWhiteSpace(secretKey) || secretKey == placeholder || secretKey.Length < 32)
    {
        throw new InvalidOperationException(
            "Jwt:SecretKey não está configurada com um valor seguro. Defina uma chave forte " +
            "(mínimo 32 caracteres, ex.: via variável de ambiente Jwt__SecretKey ou um secret " +
            "store) antes de subir a API fora do ambiente Development.");
    }
}
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Mantém os nomes originais dos claims do token ("sub", "email", etc.) em vez
        // de remapeá-los para os nomes longos do .NET (ClaimTypes.*) — facilita ler
        // o Id do usuário logado como JwtRegisteredClaimNames.Sub nos controllers.
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!)),
            // Bate com os claims "name"/"role" emitidos pelo JwtTokenGenerator —
            // necessário para [Authorize(Roles = "...")] continuar funcionando
            // com MapInboundClaims = false.
            RoleClaimType = "role",
            NameClaimType = "name"
        };
    });
builder.Services.AddAuthorization();

// Rate limiting no login (RN: mitigar força bruta de senha) — 5 tentativas por
// minuto, particionado por IP de origem. Aplicado via [EnableRateLimiting("login")]
// só no endpoint de login; o resto da API não é limitado.
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("login", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "desconhecido",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsJsonAsync(
            new { erro = "Muitas tentativas de login. Aguarde um minuto e tente novamente." },
            cancellationToken);
    };
});

// Health check de conectividade com o banco — GET /health, sem autenticação.
builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database");

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Gestão de Armazém API", Version = "v1" });

    var jwtScheme = new OpenApiSecurityScheme
    {
        Scheme = "bearer",
        BearerFormat = "JWT",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Description = "Informe o token JWT: Bearer {seu token}"
    };
    options.AddSecurityDefinition("Bearer", jwtScheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() }
    });
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(builder.Configuration["AllowedOrigins"] ?? "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Em Development, aplica automaticamente os scripts SQL pendentes (DbUp) antes de
// subir a API — evita o passo manual de rodar o migrator à parte a cada mudança de schema.
// Controlado por "Database:AutoMigrate" no appsettings (default: true em Development).
if (app.Environment.IsDevelopment() && builder.Configuration.GetValue("Database:AutoMigrate", true))
{
    var connectionString = builder.Configuration.GetConnectionString("GestaoArmazem")!;
    GestaoArmazem.Database.DatabaseMigrator.EnsureDatabaseCreated(connectionString);
    // Esse bloco só roda em Development (condição acima) — seed sempre aplicado aqui,
    // por conveniência local. Fora de Development, ninguém migra automaticamente:
    // é sempre via CLI manual (GestaoArmazem.Database), que por padrão NÃO aplica
    // seed a menos que --seed seja passado explicitamente (ver Program.cs de lá).
    GestaoArmazem.Database.DatabaseMigrator.EnsureDatabaseUpToDate(connectionString, aplicarSeed: true);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseSerilogRequestLogging(); // método/path/status/duração de cada requisição
app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();

/// <summary>Torna a classe Program (gerada implicitamente pelos top-level statements)
/// acessível para GestaoArmazem.IntegrationTests via WebApplicationFactory&lt;Program&gt;.</summary>
public partial class Program;
