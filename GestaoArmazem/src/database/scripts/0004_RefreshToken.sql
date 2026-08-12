-- 0004_RefreshToken.sql
-- Tabela de refresh tokens de sessão, usada para renovar o access token JWT
-- sem exigir novo login. Cada linha é revogada (não excluída) quando usada
-- (rotação) ou quando o usuário faz logout — mantém histórico auditável.

CREATE TABLE RefreshToken (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    UsuarioId UNIQUEIDENTIFIER NOT NULL REFERENCES Usuario(Id),
    Token NVARCHAR(200) NOT NULL,
    ExpiraEm DATETIME2 NOT NULL,
    Revogado BIT NOT NULL DEFAULT 0,
    CriadoEm DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_RefreshToken_Token UNIQUE (Token)
);

CREATE INDEX IX_RefreshToken_UsuarioId ON RefreshToken(UsuarioId);
