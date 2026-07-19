using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Exceptions;
using GestaoArmazem.Application.Interfaces;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;

namespace GestaoArmazem.Application.Services;

public class ClienteService : IClienteService
{
    private readonly IClienteRepository _clienteRepository;

    public ClienteService(IClienteRepository clienteRepository)
    {
        _clienteRepository = clienteRepository;
    }

    public async Task<IEnumerable<ClienteDto>> ListarAsync()
    {
        var clientes = await _clienteRepository.ListarAsync();
        return clientes.Select(ToDto);
    }

    public async Task<ClienteDto> CriarAsync(CriarClienteDto dto)
    {
        var cliente = new Cliente
        {
            Id = Guid.NewGuid(),
            Nome = dto.Nome,
            Documento = dto.Documento,
            Contato = dto.Contato
        };

        await _clienteRepository.CriarAsync(cliente);
        return ToDto(cliente);
    }

    public async Task<ClienteDto> AtualizarAsync(Guid id, AtualizarClienteDto dto)
    {
        var cliente = await _clienteRepository.ObterPorIdAsync(id)
            ?? throw new NotFoundException("Cliente", id);

        cliente.Nome = dto.Nome;
        cliente.Documento = dto.Documento;
        cliente.Contato = dto.Contato;

        await _clienteRepository.AtualizarAsync(cliente);
        return ToDto(cliente);
    }

    public async Task ExcluirAsync(Guid id)
    {
        _ = await _clienteRepository.ObterPorIdAsync(id) ?? throw new NotFoundException("Cliente", id);

        if (await _clienteRepository.PossuiReferenciasAsync(id))
        {
            throw new InvalidOperationException(
                "Este cliente não pode ser excluído porque já tem pedidos de expedição associados.");
        }

        await _clienteRepository.ExcluirAsync(id);
    }

    private static ClienteDto ToDto(Cliente c) => new(c.Id, c.Nome, c.Documento, c.Contato);
}
