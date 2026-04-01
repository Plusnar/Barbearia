DROP DATABASE IF EXISTS barbearia;
CREATE DATABASE barbearia DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE barbearia;

CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('CUSTOMER', 'BARBER', 'ADMIN') DEFAULT 'CUSTOMER',
  specialization VARCHAR(100),
  available BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

CREATE TABLE services (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  duration INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (active)
);

CREATE TABLE appointments (
  id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  barber_id VARCHAR(36) NOT NULL,
  service_id VARCHAR(36) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (barber_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  INDEX idx_customer_id (customer_id),
  INDEX idx_barber_id (barber_id),
  INDEX idx_appointment_date (appointment_date),
  INDEX idx_status (status)
);

INSERT INTO users (id, name, email, phone, password, role, available) 
VALUES (
  'admin-default-id-001',
  'Admin',
  'admin@barbearia.com',
  '+55 11 99999-9999',
  '$2a$10$YJYqWQZCQ3z7hJELHVN6L.9qc5/JJblSjLkKwHf9r7XqKq0x8eVsq',
  'ADMIN',
  1
);

INSERT INTO users (id, name, email, phone, password, role, specialization, available) 
VALUES 
(
  'barber-001',
  'João Silva',
  'joao@barbearia.com',
  '+55 11 98888-8888',
  '$2a$10$D9yUJKXOB3K6L5M8N9O0P.FpGqRsStUvWxYzAaBbCcDdEeFfGg',
  'BARBER',
  'Corte Clássico',
  1
),
(
  'barber-002',
  'Carlos Santos',
  'carlos@barbearia.com',
  '+55 11 97777-7777',
  '$2a$10$D9yUJKXOB3K6L5M8N9O0P.FpGqRsStUvWxYzAaBbCcDdEeFfGg',
  'BARBER',
  'Design de Barba',
  1
),
(
  'barber-003',
  'Pedro Costa',
  'pedro@barbearia.com',
  '+55 11 96666-6666',
  '$2a$10$D9yUJKXOB3K6L5M8N9O0P.FpGqRsStUvWxYzAaBbCcDdEeFfGg',
  'BARBER',
  'Corte Fade',
  1
);

INSERT INTO services (id, name, description, duration, price) 
VALUES 
(
  'service-001',
  'Corte Básico',
  'Corte padrão com máquina e tesoura',
  30,
  25.00
),
(
  'service-002',
  'Corte Premium',
  'Corte personalizado com finishing e hidratação',
  45,
  45.00
),
(
  'service-003',
  'Corte Completo',
  'Corte + Barba + Desenho + Sobrancelha',
  60,
  65.00
);

CREATE TABLE payments (
  id VARCHAR(36) PRIMARY KEY,
  appointment_id VARCHAR(36) NOT NULL,
  barber_id VARCHAR(36) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  commission DECIMAL(10, 2),
  payment_method VARCHAR(50),
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (barber_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_payment_date (payment_date),
  INDEX idx_barber_id (barber_id)
);
