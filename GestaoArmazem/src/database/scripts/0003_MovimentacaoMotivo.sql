-- 0003_MovimentacaoMotivo.sql
-- Adiciona o campo Motivo em MovimentacaoEstoque, usado principalmente pelo
-- Ajuste de estoque (ex.: "Contagem de inventário", "Produto avariado").
-- Nulo para os demais tipos de movimentação (Entrada, Saida, Transferencia).

ALTER TABLE MovimentacaoEstoque ADD Motivo NVARCHAR(300) NULL;
