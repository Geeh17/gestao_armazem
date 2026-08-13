using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Xunit;

namespace GestaoArmazem.IntegrationTests;

/// <summary>
/// Cobre o fluxo de estoque ponta a ponta contra um SQL Server real — diferente dos
/// testes unitários (que mockam os repositórios), estes pegam erros de SQL de verdade.
/// Foi assim que um bug de ordem de colunas no relatório de estoque baixo passou
/// despercebido pelos testes unitários do back-end (ver RelatorioEstoqueBaixo_ abaixo).
/// </summary>
public class FluxoEstoqueTests : IClassFixture<IntegrationTestFixture>
{
    private readonly HttpClient _client;

    public FluxoEstoqueTests(IntegrationTestFixture fixture)
    {
        _client = fixture.Factory.CreateClient();
    }

    private async Task AutenticarAsync()
    {
        var resposta = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "admin@gestaoarmazem.local",
            senha = "Admin@123"
        });
        resposta.EnsureSuccessStatusCode();

        var corpo = await resposta.Content.ReadFromJsonAsync<TokenResponse>();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", corpo!.Token);
    }

    private async Task<Guid> ObterCategoriaSeedAsync()
    {
        var categorias = await _client.GetFromJsonAsync<List<CategoriaResponse>>("/api/categorias");
        return categorias!.First().Id;
    }

    private async Task<Guid> ObterLocalizacaoSeedAsync()
    {
        var localizacoes = await _client.GetFromJsonAsync<List<LocalizacaoResponse>>("/api/localizacoes");
        return localizacoes!.First().Id;
    }

    private async Task<Guid> CriarProdutoAsync(string sku)
    {
        var categoriaId = await ObterCategoriaSeedAsync();

        var resposta = await _client.PostAsJsonAsync("/api/produtos", new
        {
            sku,
            nome = $"Produto de teste {sku}",
            descricao = (string?)null,
            categoriaId,
            unidadeMedida = "UN",
            codigoBarras = (string?)null,
            estoqueMinimo = 5
        });
        resposta.EnsureSuccessStatusCode();

        var produto = await resposta.Content.ReadFromJsonAsync<ProdutoResponse>();
        return produto!.Id;
    }

    [Fact]
    public async Task Login_ComCredenciaisDoSeed_DeveAutenticar()
    {
        var resposta = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "admin@gestaoarmazem.local",
            senha = "Admin@123"
        });

        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);
        var corpo = await resposta.Content.ReadFromJsonAsync<TokenResponse>();
        Assert.False(string.IsNullOrWhiteSpace(corpo!.Token));
        Assert.False(string.IsNullOrWhiteSpace(corpo.RefreshToken));
    }

    [Fact]
    public async Task Login_ComSenhaErrada_DeveRetornar401()
    {
        var resposta = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "admin@gestaoarmazem.local",
            senha = "senha-errada"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, resposta.StatusCode);
    }

    private async Task<Guid> ObterUsuarioLogadoIdAsync()
  {
      var usuarios = await _client.GetFromJsonAsync<List<UsuarioResponse>>("/api/usuarios");
      return usuarios!.First(u => u.Email == "admin@gestaoarmazem.local").Id;
  }

  [Fact]
  public async Task FluxoCompleto_Entrada_Saida_AtualizaSaldoCorretamente_RN01()
  {
      await AutenticarAsync();
      var produtoId = await CriarProdutoAsync($"SKU-{Guid.NewGuid():N}"[..12]);
      var localizacaoId = await ObterLocalizacaoSeedAsync();
      var usuarioId = await ObterUsuarioLogadoIdAsync();

      var entrada = await _client.PostAsJsonAsync("/api/movimentacoes/entrada", new
      {
          produtoId,
          localizacaoId,
          quantidade = 10,
          usuarioId
      });
      Assert.Equal(HttpStatusCode.NoContent, entrada.StatusCode);

      var saldoAposEntrada = await _client.GetFromJsonAsync<List<EstoqueResponse>>(
          $"/api/estoque?produtoId={produtoId}");
      Assert.Equal(10, saldoAposEntrada!.Single(s => s.LocalizacaoId == localizacaoId).Quantidade);

      var saida = await _client.PostAsJsonAsync("/api/movimentacoes/saida", new
      {
          produtoId,
          localizacaoId,
          quantidade = 4,
          usuarioId
      });
      Assert.Equal(HttpStatusCode.NoContent, saida.StatusCode);

      var saldoAposSaida = await _client.GetFromJsonAsync<List<EstoqueResponse>>(
          $"/api/estoque?produtoId={produtoId}");
      Assert.Equal(6, saldoAposSaida!.Single(s => s.LocalizacaoId == localizacaoId).Quantidade);

      // RN01: saída maior que o saldo disponível é rejeitada, e o saldo não muda.
      var saidaExcessiva = await _client.PostAsJsonAsync("/api/movimentacoes/saida", new
      {
          produtoId,
          localizacaoId,
          quantidade = 1000,
          usuarioId
      });
      Assert.Equal(HttpStatusCode.UnprocessableEntity, saidaExcessiva.StatusCode);

      var saldoFinal = await _client.GetFromJsonAsync<List<EstoqueResponse>>(
          $"/api/estoque?produtoId={produtoId}");
      Assert.Equal(6, saldoFinal!.Single(s => s.LocalizacaoId == localizacaoId).Quantidade);
  }

    [Fact]
    public async Task RelatorioEstoqueBaixo_RetornaFormatoConsistente_SemErroDeDesserializacao()
    {
        // Este é o teste que teria pego o bug real de produção: o SELECT do relatório
        // tinha as colunas em ordem diferente do record posicional EstoqueBaixoResumo,
        // e isso só quebra contra o Dapper de verdade — um repositório mockado nunca
        // executa esse SQL, então os testes unitários não pegam esse tipo de erro.
        await AutenticarAsync();

        var resposta = await _client.GetAsync("/api/relatorios/estoque-baixo");

        resposta.EnsureSuccessStatusCode();
        var itens = await resposta.Content.ReadFromJsonAsync<List<EstoqueBaixoResponse>>();
        Assert.NotNull(itens);
    }

    [Fact]
    public async Task Endpoint_SemToken_DeveRetornar401()
    {
        var resposta = await _client.GetAsync("/api/produtos");
        Assert.Equal(HttpStatusCode.Unauthorized, resposta.StatusCode);
    }

    private record TokenResponse(string Token, DateTime ExpiraEm, string RefreshToken);
    private record CategoriaResponse(Guid Id, string Nome);
    private record LocalizacaoResponse(Guid Id, Guid ArmazemId, string Corredor, string Prateleira, string Nivel, string Codigo);
    private record ProdutoResponse(Guid Id, string SKU, string Nome);
    private record EstoqueBaixoResponse(Guid ProdutoId, string Sku, string Nome, int SaldoTotal, int EstoqueMinimo);
    private record UsuarioResponse(Guid Id, string Nome, string Email, Guid PerfilId, string PerfilNome);
    private record EstoqueResponse(Guid ProdutoId, Guid LocalizacaoId, int Quantidade);
}
