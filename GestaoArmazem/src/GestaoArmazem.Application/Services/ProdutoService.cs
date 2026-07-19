using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Exceptions;
using GestaoArmazem.Application.Interfaces;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;

namespace GestaoArmazem.Application.Services;

public class ProdutoService : IProdutoService
{
    private readonly IProdutoRepository _produtoRepository;

    public ProdutoService(IProdutoRepository produtoRepository)
    {
        _produtoRepository = produtoRepository;
    }

    public async Task<ProdutoDto?> ObterPorIdAsync(Guid id)
    {
        var produto = await _produtoRepository.ObterPorIdAsync(id);
        return produto is null ? null : ToDto(produto);
    }

    public async Task<IEnumerable<ProdutoDto>> ListarAsync(int pagina, int tamanhoPagina)
    {
        var produtos = await _produtoRepository.ListarAsync(pagina, tamanhoPagina);
        return produtos.Select(ToDto);
    }

    public async Task<ProdutoDto> CriarAsync(CriarProdutoDto dto)
    {
        // RN03: o SKU de um produto é único em todo o sistema.
        var existente = await _produtoRepository.ObterPorSkuAsync(dto.SKU);
        if (existente is not null)
        {
            throw new InvalidOperationException($"Já existe um produto cadastrado com o SKU '{dto.SKU}'.");
        }

        var produto = new Produto
        {
            Id = Guid.NewGuid(),
            SKU = dto.SKU,
            Nome = dto.Nome,
            Descricao = dto.Descricao,
            CategoriaId = dto.CategoriaId,
            UnidadeMedida = dto.UnidadeMedida,
            CodigoBarras = dto.CodigoBarras,
            EstoqueMinimo = dto.EstoqueMinimo
        };

        await _produtoRepository.CriarAsync(produto);
        return ToDto(produto);
    }

    public async Task<ProdutoDto> AtualizarAsync(Guid id, AtualizarProdutoDto dto)
    {
        var produto = await _produtoRepository.ObterPorIdAsync(id)
            ?? throw new NotFoundException("Produto", id);

        produto.Nome = dto.Nome;
        produto.Descricao = dto.Descricao;
        produto.CategoriaId = dto.CategoriaId;
        produto.UnidadeMedida = dto.UnidadeMedida;
        produto.CodigoBarras = dto.CodigoBarras;
        produto.EstoqueMinimo = dto.EstoqueMinimo;

        await _produtoRepository.AtualizarAsync(produto);
        return ToDto(produto);
    }

    public async Task ExcluirAsync(Guid id)
    {
        _ = await _produtoRepository.ObterPorIdAsync(id) ?? throw new NotFoundException("Produto", id);

        if (await _produtoRepository.PossuiReferenciasAsync(id))
        {
            throw new InvalidOperationException(
                "Este produto não pode ser excluído porque já tem estoque, movimentações ou pedidos associados.");
        }

        await _produtoRepository.ExcluirAsync(id);
    }

    private static ProdutoDto ToDto(Produto p) => new(
        p.Id, p.SKU, p.Nome, p.Descricao, p.CategoriaId, p.UnidadeMedida, p.CodigoBarras, p.EstoqueMinimo);
}
