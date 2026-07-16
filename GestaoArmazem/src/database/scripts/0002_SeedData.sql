-- 0002_SeedData.sql
-- Dados iniciais para desenvolvimento/homologação.

INSERT INTO Perfil (Id, Nome) VALUES
    (NEWID(), 'Administrador'),
    (NEWID(), 'Gestor de Estoque'),
    (NEWID(), 'Operador de Armazem');

INSERT INTO Categoria (Id, Nome) VALUES
    (NEWID(), 'Geral'),
    (NEWID(), 'Eletronicos'),
    (NEWID(), 'Embalagens');

-- Armazém e localização padrão, úteis para os primeiros testes manuais/automatizados.
DECLARE @ArmazemId UNIQUEIDENTIFIER = NEWID();
INSERT INTO Armazem (Id, Nome, Endereco) VALUES (@ArmazemId, 'Armazem Central', 'Endereco a definir');

INSERT INTO Localizacao (Id, ArmazemId, Corredor, Prateleira, Nivel, Codigo)
VALUES (NEWID(), @ArmazemId, 'A1', 'P1', 'N1', 'A1-P1-N1');
