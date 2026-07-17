using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Services;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;
using Moq;
using Xunit;

namespace GestaoArmazem.Application.Tests;

public class LocalizacaoServiceTests
{
    private readonly Mock<ILocalizacaoRepository> _localizacaoRepository = new();
    private readonly Mock<IArmazemRepository> _armazemRepository = new();
    private readonly LocalizacaoService _sut;

    public LocalizacaoServiceTests()
    {
        _sut = new LocalizacaoService(_localizacaoRepository.Object, _armazemRepository.Object);
    }

    [Fact]
    public async Task CriarAsync_ComArmazemInexistente_DeveLancarInvalidOperationException()
    {
        var dto = new CriarLocalizacaoDto(Guid.NewGuid(), "A1", "P1", "N1", "A1-P1-N1");
        _armazemRepository.Setup(r => r.ObterPorIdAsync(dto.ArmazemId)).ReturnsAsync((Armazem?)null);

        await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.CriarAsync(dto));

        _localizacaoRepository.Verify(r => r.CriarAsync(It.IsAny<Localizacao>()), Times.Never);
    }

    [Fact]
    public async Task CriarAsync_ComCodigoJaExistenteNoMesmoArmazem_DeveLancarInvalidOperationException()
    {
        var armazemId = Guid.NewGuid();
        var dto = new CriarLocalizacaoDto(armazemId, "A1", "P1", "N1", "A1-P1-N1");

        _armazemRepository.Setup(r => r.ObterPorIdAsync(armazemId)).ReturnsAsync(new Armazem { Id = armazemId });
        _localizacaoRepository
            .Setup(r => r.ListarPorArmazemAsync(armazemId))
            .ReturnsAsync(new[] { new Localizacao { ArmazemId = armazemId, Codigo = "A1-P1-N1" } });

        await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.CriarAsync(dto));

        _localizacaoRepository.Verify(r => r.CriarAsync(It.IsAny<Localizacao>()), Times.Never);
    }

    [Fact]
    public async Task CriarAsync_ComDadosValidos_DeveCriarLocalizacao()
    {
        var armazemId = Guid.NewGuid();
        var dto = new CriarLocalizacaoDto(armazemId, "A1", "P1", "N1", "A1-P1-N1");

        _armazemRepository.Setup(r => r.ObterPorIdAsync(armazemId)).ReturnsAsync(new Armazem { Id = armazemId });
        _localizacaoRepository.Setup(r => r.ListarPorArmazemAsync(armazemId)).ReturnsAsync(Array.Empty<Localizacao>());

        var resultado = await _sut.CriarAsync(dto);

        Assert.Equal(dto.Codigo, resultado.Codigo);
        _localizacaoRepository.Verify(r => r.CriarAsync(It.IsAny<Localizacao>()), Times.Once);
    }
}
