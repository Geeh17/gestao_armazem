using GestaoArmazem.Application.DTOs;
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

    private static ClienteDto ToDto(Cliente c) => new(c.Id, c.Nome, c.Documento, c.Contato);
}
