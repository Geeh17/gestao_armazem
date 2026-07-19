using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Exceptions;
using GestaoArmazem.Application.Interfaces;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;

namespace GestaoArmazem.Application.Services;

public class FornecedorService : IFornecedorService
{
    private readonly IFornecedorRepository _fornecedorRepository;

    public FornecedorService(IFornecedorRepository fornecedorRepository)
    {
        _fornecedorRepository = fornecedorRepository;
    }

    public async Task<IEnumerable<FornecedorDto>> ListarAsync()
    {
        var fornecedores = await _fornecedorRepository.ListarAsync();
        return fornecedores.Select(ToDto);
    }

    public async Task<FornecedorDto> CriarAsync(CriarFornecedorDto dto)
    {
        var fornecedor = new Fornecedor
        {
            Id = Guid.NewGuid(),
            Nome = dto.Nome,
            CNPJ = dto.CNPJ,
            Contato = dto.Contato
        };

        await _fornecedorRepository.CriarAsync(fornecedor);
        return ToDto(fornecedor);
    }

    public async Task<FornecedorDto> AtualizarAsync(Guid id, AtualizarFornecedorDto dto)
    {
        var fornecedor = await _fornecedorRepository.ObterPorIdAsync(id)
            ?? throw new NotFoundException("Fornecedor", id);

        fornecedor.Nome = dto.Nome;
        fornecedor.CNPJ = dto.CNPJ;
        fornecedor.Contato = dto.Contato;

        await _fornecedorRepository.AtualizarAsync(fornecedor);
        return ToDto(fornecedor);
    }

    public async Task ExcluirAsync(Guid id)
    {
        _ = await _fornecedorRepository.ObterPorIdAsync(id) ?? throw new NotFoundException("Fornecedor", id);

        if (await _fornecedorRepository.PossuiReferenciasAsync(id))
        {
            throw new InvalidOperationException(
                "Este fornecedor não pode ser excluído porque já tem pedidos de recebimento associados.");
        }

        await _fornecedorRepository.ExcluirAsync(id);
    }

    private static FornecedorDto ToDto(Fornecedor f) => new(f.Id, f.Nome, f.CNPJ, f.Contato);
}
