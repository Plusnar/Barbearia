-- Trilha de auditoria financeira (append-only).
-- Execute uma vez no TiDB antes do deploy.

USE barbearia;

CREATE TABLE IF NOT EXISTS financial_audit_log (
  id VARCHAR(36) PRIMARY KEY,
  entity VARCHAR(60) NOT NULL,
  entity_id VARCHAR(36) NOT NULL,
  action VARCHAR(40) NOT NULL,
  actor_id VARCHAR(36),
  before_json JSON,
  after_json JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_entity (entity, entity_id),
  INDEX idx_audit_actor (actor_id),
  INDEX idx_audit_created_at (created_at),
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);
