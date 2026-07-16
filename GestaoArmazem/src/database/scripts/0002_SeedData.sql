-- 0002_SeedData.sql
-- Dados iniciais para desenvolvimento/homologação.

INSERT INTO Perfil (Id, Nome) VALUES
    (NEWID(), 'Administrador'),
    (NEWID(), 'Gestor de Estoque'),
    (NEWID(), 'Operador de Armazem');

-- Usuário administrador para desenvolvimento.
-- Senha: Admin@123 (hash bcrypt abaixo). Troque em qualquer ambiente que não seja local.
DECLARE @PerfilAdminId UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM Perfil WHERE Nome = 'Administrador');
INSERT INTO Usuario (Id, Nome, Email, SenhaHash, PerfilId) VALUES
    (NEWID(), 'Administrador', 'admin@gestaoarmazem.local',
     '$2b$11$hn/1eMquxYXQ8zYJF8mFB.MnHIPxt.VaU2pu7Lf3jEAseJxL.vGQi', @PerfilAdminId);

INSERT INTO Categoria (Id, Nome) VALUES
    (NEWID(), 'Geral'),
    (NEWID(), 'Eletronicos'),
    (NEWID(), 'Embalagens');

-- Armazém e localização padrão, úteis para os primeiros testes manuais/automatizados.
DECLARE @ArmazemId UNIQUEIDENTIFIER = NEWID();
INSERT INTO Armazem (Id, Nome, Endereco) VALUES (@ArmazemId, 'Armazem Central', 'Endereco a definir');

INSERT INTO Localizacao (Id, ArmazemId, Corredor, Prateleira, Nivel, Codigo)
VALUES (NEWID(), @ArmazemId, 'A1', 'P1', 'N1', 'A1-P1-N1');
