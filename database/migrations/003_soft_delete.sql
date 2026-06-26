-- Soft delete para preservar historico de barbeiros e agendamentos.
-- Execute uma vez no TiDB antes do deploy.

USE barbearia;

ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
CREATE INDEX idx_users_deleted_at ON users (deleted_at);
