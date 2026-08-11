using GestaoArmazem.Application.DTOs;
using GestaoArmazem.Application.Exceptions;
using GestaoArmazem.Application.Interfaces;
using GestaoArmazem.Domain.Entities;
using GestaoArmazem.Domain.Interfaces;

namespace GestaoArmazem.Application.Services;

public class UsuarioService : IUsuarioService
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IPerfilRepository _perfilRepository;
    private readonly IPasswordHasher _passwordHasher;

    public UsuarioService(
        IUsuarioRepository usuarioRepository,
        IPerfilRepository perfilRepository,
        IPasswordHasher passwordHasher)
    {
        _usuarioRepository = usuarioRepository;
        _perfilRepository = perfilRepository;
        _passwordHasher = passwordHasher;
    }

    public async Task<IEnumerable<UsuarioDto>> ListarAsync()
    {
        var usuarios = await _usuarioRepository.ListarAsync();
        var perfis = (await _perfilRepository.ListarAsync()).ToDictionary(p => p.Id, p => p.Nome);

        return usuarios.Select(u => new UsuarioDto(
            u.Id, u.Nome, u.Email, u.PerfilId,
            perfis.TryGetValue(u.PerfilId, out var nomePerfil) ? nomePerfil : "Desconhecido"));
    }

    public async Task<UsuarioDto> CriarAsync(CriarUsuarioDto dto)
    {
        var existente = await _usuarioRepository.ObterPorEmailAsync(dto.Email);
        if (existente is not null)
        {
            throw new InvalidOperationException($"Já existe um usuário cadastrado com o email '{dto.Email}'.");
        }

        var perfil = await _perfilRepository.ObterPorIdAsync(dto.PerfilId)
            ?? throw new NotFoundException("Perfil", dto.PerfilId);

        var usuario = new Usuario
        {
            Id = Guid.NewGuid(),
            Nome = dto.Nome,
            Email = dto.Email,
            SenhaHash = _passwordHasher.Hash(dto.Senha),
            PerfilId = dto.PerfilId
        };

        await _usuarioRepository.CriarAsync(usuario);
        return new UsuarioDto(usuario.Id, usuario.Nome, usuario.Email, usuario.PerfilId, perfil.Nome);
    }

    public async Task<UsuarioDto> AtualizarAsync(Guid id, AtualizarUsuarioDto dto)
    {
        var usuario = await _usuarioRepository.ObterPorIdAsync(id)
            ?? throw new NotFoundException("Usuário", id);

        var existenteComEmail = await _usuarioRepository.ObterPorEmailAsync(dto.Email);
        if (existenteComEmail is not null && existenteComEmail.Id != id)
        {
            throw new InvalidOperationException($"Já existe um usuário cadastrado com o email '{dto.Email}'.");
        }

        var perfil = await _perfilRepository.ObterPorIdAsync(dto.PerfilId)
            ?? throw new NotFoundException("Perfil", dto.PerfilId);

        usuario.Nome = dto.Nome;
        usuario.Email = dto.Email;
        usuario.PerfilId = dto.PerfilId;

        await _usuarioRepository.AtualizarAsync(usuario);
        return new UsuarioDto(usuario.Id, usuario.Nome, usuario.Email, usuario.PerfilId, perfil.Nome);
    }

    public async Task ExcluirAsync(Guid id)
    {
        _ = await _usuarioRepository.ObterPorIdAsync(id) ?? throw new NotFoundException("Usuário", id);

        if (await _usuarioRepository.PossuiReferenciasAsync(id))
        {
            throw new InvalidOperationException(
                "Este usuário não pode ser excluído porque já registrou movimentações de estoque.");
        }

        await _usuarioRepository.ExcluirAsync(id);
    }

    public async Task ResetarSenhaAsync(Guid usuarioId, ResetarSenhaDto dto)
    {
        _ = await _usuarioRepository.ObterPorIdAsync(usuarioId) ?? throw new NotFoundException("Usuário", usuarioId);

        var novoHash = _passwordHasher.Hash(dto.NovaSenha);
        await _usuarioRepository.AtualizarSenhaHashAsync(usuarioId, novoHash);
    }

    public async Task AlterarSenhaAsync(Guid usuarioId, AlterarSenhaDto dto)
    {
        var usuario = await _usuarioRepository.ObterPorIdAsync(usuarioId)
            ?? throw new NotFoundException("Usuário", usuarioId);

        if (!_passwordHasher.Verificar(dto.SenhaAtual, usuario.SenhaHash))
        {
            throw new CredenciaisInvalidasException();
        }

        var novoHash = _passwordHasher.Hash(dto.NovaSenha);
        await _usuarioRepository.AtualizarSenhaHashAsync(usuarioId, novoHash);
    }
}
