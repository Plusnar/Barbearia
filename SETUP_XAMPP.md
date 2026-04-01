# Setup Barbearia com XAMPP

## 📋 Pré-requisitos
- XAMPP instalado (https://www.apachefriends.org/)
- Node.js 18+ instalado (https://nodejs.org/)
- Git instalado

## 🚀 Passo a Passo

### 1️⃣ Inicie XAMPP
- Abra o **XAMPP Control Panel**
- Clique em **Start** para:
  - ✅ Apache
  - ✅ MySQL

### 2️⃣ Configure o Banco de Dados

**Acesse phpMyAdmin:**
- Abra seu navegador: http://localhost/phpmyadmin
- Faça login (padrão: root / sem senha)

**Importe o schema SQL:**
1. Clique em **Importar** (ou Import)
2. Selecione: `database/schema.sql`
3. Clique em **Executar** (Execute)

**Resultado esperado:**
- ✅ Banco de dados `barbearia` criado
- ✅ Tabelas: `users`, `services`, `appointments`

### 3️⃣ Configure o Backend Node.js

```bash
# Navegue até a pasta do backend
cd backend

# Instale as dependências
npm install

# Inicie o servidor
npm start
```

**Resultado esperado:**
```
Database connected successfully
Server is running on port 5000
```

### 4️⃣ Teste a API

Abra em um terminal:
```bash
curl http://localhost:5000/api/auth/register
```

Ou use **Postman**/**Insomnia** para testar:
- **POST** http://localhost:5000/api/auth/register
- **POST** http://localhost:5000/api/auth/login

### 5️⃣ Desenvolva o App Android

```bash
# Abra Android Studio
# Atualize a URL da API em: android/app/src/main/java/com/barbearia/app/utils/AppConfig.kt
# Configure para: http://10.0.2.2:5000 (emulador)
```

---

## 🔧 Configurações Importantes

### `.env` (backend)
```
DB_HOST=localhost        # XAMPP MySQL
DB_USER=root             # Usuário padrão XAMPP
DB_PASSWORD=             # Sem senha (padrão)
DB_NAME=barbearia        # Nome do banco
JWT_SECRET=sua_chave_secreta
PORT=5000
NODE_ENV=development
```

### Porta MySQL
- **Padrão XAMPP:** 3306
- Verifique em XAMPP Control Panel > Config > MySQL > my.ini

---

## 📊 Arquitetura

```
XAMPP
├── MySQL (porta 3306)
│   └── Database: barbearia
├── phpMyAdmin (http://localhost/phpmyadmin)
│
Node.js (seu projeto)
├── Backend API (porta 5000)
│   └── Conecta ao MySQL do XAMPP
│
Android App
├── Conecta ao Backend (http://10.0.2.2:5000)
```

---

## ✅ Checklist de Sucesso

- [ ] XAMPP Apache inicializado
- [ ] XAMPP MySQL inicializado
- [ ] Banco de dados `barbearia` criado
- [ ] Backend rodando em http://localhost:5000
- [ ] phpMyAdmin acessível em http://localhost/phpmyadmin
- [ ] Tabelas criadas (users, services, appointments)
- [ ] App Android pode fazer requisições

---

## 🆘 Troubleshooting

### "Connection refused" ao conectar no MySQL
- Verifique se MySQL está rodando no XAMPP
- Verifique a porta (padrão: 3306)
- Reinicie o MySQL

### "Cannot find module"
```bash
cd backend
rm -rf node_modules
npm install
```

### App Android não consegue conectar
- Use `http://10.0.2.2:5000` no emulador
- Use `http://seu-ip:5000` em dispositivo físico

---

## 📚 Recursos

- [Documentação Node.js](https://nodejs.org/docs/)
- [XAMPP Documentation](https://www.apachefriends.org/faq.html)
- [MySQL Documentation](https://dev.mysql.com/doc/)
