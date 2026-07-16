using System.Net;
using System.Text.Json;
using FluentValidation;
using GestaoArmazem.Application.Exceptions;

namespace GestaoArmazem.API.Middleware;

/// <summary>
/// Traduz exceções da Application em respostas HTTP consistentes,
/// evitando que os controllers precisem de try/catch repetido.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var (statusCode, mensagem) = ex switch
            {
                ValidationException validationEx => (HttpStatusCode.BadRequest, string.Join(" ", validationEx.Errors.Select(e => e.ErrorMessage))),
                CredenciaisInvalidasException => (HttpStatusCode.Unauthorized, ex.Message),
                SaldoInsuficienteException => (HttpStatusCode.UnprocessableEntity, ex.Message),
                NotFoundException => (HttpStatusCode.NotFound, ex.Message),
                InvalidOperationException => (HttpStatusCode.Conflict, ex.Message),
                _ => (HttpStatusCode.InternalServerError, "Ocorreu um erro inesperado ao processar a requisição.")
            };

            if (statusCode == HttpStatusCode.InternalServerError)
            {
                _logger.LogError(ex, "Erro não tratado ao processar {Path}", context.Request.Path);
            }

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)statusCode;
            await context.Response.WriteAsync(JsonSerializer.Serialize(new { erro = mensagem }));
        }
    }
}
