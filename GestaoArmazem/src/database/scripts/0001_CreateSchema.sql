-- 0001_CreateSchema.sql
-- Cria o schema inicial do banco de dados GestaoArmazem.
-- Compatível com SQL Server 2019+.

CREATE TABLE Perfil (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    Nome NVARCHAR(50) NOT NULL
);

CREATE TABLE Usuario (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    Nome NVARCHAR(150) NOT NULL,
    Email NVARCHAR(200) NOT NULL,
    SenhaHash NVARCHAR(300) NOT NULL,
    PerfilId UNIQUEIDENTIFIER NOT NULL REFERENCES Perfil(Id),
    CONSTRAINT UQ_Usuario_Email UNIQUE (Email)
);

CREATE TABLE Categoria (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    Nome NVARCHAR(100) NOT NULL
);

CREATE TABLE Produto (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    SKU NVARCHAR(50) NOT NULL,
    Nome NVARCHAR(200) NOT NULL,
    Descricao NVARCHAR(1000) NULL,
    CategoriaId UNIQUEIDENTIFIER NOT NULL REFERENCES Categoria(Id),
    UnidadeMedida NVARCHAR(10) NOT NULL DEFAULT 'UN',
    CodigoBarras NVARCHAR(50) NULL,
    EstoqueMinimo INT NOT NULL DEFAULT 0,
    CONSTRAINT UQ_Produto_SKU UNIQUE (SKU) -- RN03
);

CREATE TABLE Armazem (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    Nome NVARCHAR(150) NOT NULL,
    Endereco NVARCHAR(300) NULL
);

CREATE TABLE Localizacao (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    ArmazemId UNIQUEIDENTIFIER NOT NULL REFERENCES Armazem(Id), -- RN04
    Corredor NVARCHAR(20) NOT NULL,
    Prateleira NVARCHAR(20) NOT NULL,
    Nivel NVARCHAR(20) NOT NULL,
    Codigo NVARCHAR(50) NOT NULL,
    CONSTRAINT UQ_Localizacao_Codigo UNIQUE (ArmazemId, Codigo)
);

CREATE TABLE Estoque (
    ProdutoId UNIQUEIDENTIFIER NOT NULL REFERENCES Produto(Id),
    LocalizacaoId UNIQUEIDENTIFIER NOT NULL REFERENCES Localizacao(Id),
    Quantidade INT NOT NULL DEFAULT 0,
    RowVersion ROWVERSION NOT NULL, -- controle de concorrência otimista
    CONSTRAINT PK_Estoque PRIMARY KEY (ProdutoId, LocalizacaoId),
    CONSTRAINT CK_Estoque_QuantidadeNaoNegativa CHECK (Quantidade >= 0) -- reforço de RN01 no banco
);

CREATE TABLE MovimentacaoEstoque (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    ProdutoId UNIQUEIDENTIFIER NOT NULL REFERENCES Produto(Id),
    LocalizacaoOrigemId UNIQUEIDENTIFIER NULL REFERENCES Localizacao(Id),
    LocalizacaoDestinoId UNIQUEIDENTIFIER NULL REFERENCES Localizacao(Id),
    Quantidade INT NOT NULL,
    Tipo TINYINT NOT NULL, -- 1=Entrada, 2=Saida, 3=Transferencia, 4=Ajuste
    Data DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UsuarioId UNIQUEIDENTIFIER NOT NULL REFERENCES Usuario(Id)
    -- RN02: somente inserção. Nenhum UPDATE/DELETE deve ser executado nesta tabela;
    -- a aplicação não expõe operações de edição/remoção para esta entidade.
);
CREATE INDEX IX_MovimentacaoEstoque_ProdutoId ON MovimentacaoEstoque(ProdutoId);
CREATE INDEX IX_MovimentacaoEstoque_Data ON MovimentacaoEstoque(Data);

CREATE TABLE Fornecedor (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    Nome NVARCHAR(200) NOT NULL,
    CNPJ NVARCHAR(20) NULL,
    Contato NVARCHAR(200) NULL
);

CREATE TABLE PedidoRecebimento (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    FornecedorId UNIQUEIDENTIFIER NOT NULL REFERENCES Fornecedor(Id),
    Status TINYINT NOT NULL DEFAULT 1, -- 1=Pendente, 2=EmAndamento, 3=Concluido, 4=Cancelado
    DataPrevista DATETIME2 NOT NULL,
    DataRecebimento DATETIME2 NULL
);

CREATE TABLE ItemPedidoRecebimento (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    PedidoRecebimentoId UNIQUEIDENTIFIER NOT NULL REFERENCES PedidoRecebimento(Id),
    ProdutoId UNIQUEIDENTIFIER NOT NULL REFERENCES Produto(Id),
    QuantidadeEsperada INT NOT NULL,
    QuantidadeRecebida INT NOT NULL DEFAULT 0
);

CREATE TABLE Cliente (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    Nome NVARCHAR(200) NOT NULL,
    Documento NVARCHAR(20) NULL,
    Contato NVARCHAR(200) NULL
);

CREATE TABLE PedidoExpedicao (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    ClienteId UNIQUEIDENTIFIER NOT NULL REFERENCES Cliente(Id),
    Status TINYINT NOT NULL DEFAULT 1,
    DataPrevista DATETIME2 NOT NULL,
    DataExpedicao DATETIME2 NULL
);

CREATE TABLE ItemPedidoExpedicao (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    PedidoExpedicaoId UNIQUEIDENTIFIER NOT NULL REFERENCES PedidoExpedicao(Id),
    ProdutoId UNIQUEIDENTIFIER NOT NULL REFERENCES Produto(Id),
    QuantidadeSolicitada INT NOT NULL,
    QuantidadeExpedida INT NOT NULL DEFAULT 0
);
