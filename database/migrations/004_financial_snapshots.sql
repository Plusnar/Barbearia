-- Snapshots de preco e comissao no momento do fato.
-- Execute uma vez no TiDB antes do deploy.

USE barbearia;

ALTER TABLE appointments ADD COLUMN price_snapshot DECIMAL(10, 2) NULL DEFAULT NULL;
ALTER TABLE appointments ADD COLUMN commission_snapshot DECIMAL(5, 2) NULL DEFAULT NULL;
