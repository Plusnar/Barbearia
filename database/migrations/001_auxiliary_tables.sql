-- Tabelas auxiliares usadas pela API.
-- Execute uma vez no TiDB antes do deploy (ou após atualizar o projeto).

USE barbearia;

CREATE TABLE IF NOT EXISTS barber_working_hours (
  barber_id VARCHAR(36) NOT NULL,
  day_of_week TINYINT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (barber_id, day_of_week),
  INDEX idx_barber_working_hours_day (day_of_week),
  FOREIGN KEY (barber_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appointment_slot_locks (
  lock_key VARCHAR(160) PRIMARY KEY,
  appointment_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_appointment_slot_locks_appointment_id (appointment_id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS barber_commissions (
  barber_id VARCHAR(36) PRIMARY KEY,
  commission_percentage DECIMAL(5, 2) NOT NULL DEFAULT 50,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (barber_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profit_entries (
  id VARCHAR(36) PRIMARY KEY,
  appointment_id VARCHAR(36) UNIQUE,
  barber_id VARCHAR(36),
  source VARCHAR(120) NOT NULL,
  entry_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  commission_percentage DECIMAL(5, 2) NOT NULL,
  payment_method VARCHAR(50),
  notes TEXT,
  previous_appointment_status ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'),
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_profit_entries_date (entry_date),
  INDEX idx_profit_entries_barber_id (barber_id),
  INDEX idx_profit_entries_created_by (created_by),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  FOREIGN KEY (barber_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
