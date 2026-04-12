-- ============================================
-- COMANDOS SQL PARA VERIFICAR DADOS NO TIDB
-- ============================================

-- ⚠️ SEMPRE EXECUTE PRIMEIRO:
USE barbearia;

-- 1️⃣ VER TODOS OS USUÁRIOS CADASTRADOS
SELECT id, name, email, phone, role, created_at 
FROM users 
ORDER BY created_at DESC;

-- 2️⃣ VER UM USUÁRIO ESPECÍFICO
USE barbearia;
SELECT * FROM users 
WHERE email = 'joao@test.com';

-- 3️⃣ CONTAR TOTAL DE USUÁRIOS
USE barbearia;
SELECT COUNT(*) as total_users FROM users;

-- 4️⃣ VER CLIENTES (CUSTOMERS)
USE barbearia;
SELECT id, name, email, role, created_at 
FROM users 
WHERE role = 'customer';

-- 5️⃣ VER BARBEIROS
USE barbearia;
SELECT id, name, email, role, created_at 
FROM users 
WHERE role = 'barber';

-- 6️⃣ VER ÚLTIMOS 5 USUÁRIOS REGISTRADOS
USE barbearia;
SELECT id, name, email, role, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

-- 7️⃣ VERIFICAR ESTRUTURA DA TABELA
USE barbearia;
DESCRIBE users;

-- 8️⃣ VER TODAS AS TABELAS
USE barbearia;
SHOW TABLES;

-- 9️⃣ VER SERVIÇOS CADASTRADOS
USE barbearia;
SELECT * FROM services;

-- 🔟 VER AGENDAMENTOS
USE barbearia;
SELECT * FROM appointments;
