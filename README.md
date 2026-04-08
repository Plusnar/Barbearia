# 🏳️ Barbearia - Barbershop Management System

Sistema de gerenciamento de barbearia com backend em **Node.js** e app mobile **Android**.

---

## 🚀 Quick Start

### Backend Node.js

```bash
# Navegue até a pasta backend
cd backend

# Instale as dependências (primeira vez)
npm install

# Inicie o servidor
npm start

# Para desenvolvimento (com auto-reload)
npm run dev
```

**Resultado esperado:**
```
Database connected successfully
Server is running on port 5000
```

### Android App

```bash
# Abra Android Studio
# Abra a pasta: android/
# Clique em "Run" (▶️)
```

---

## ⚙️ Variáveis de Ambiente

O arquivo `.env` já está configurado com as credenciais do **TiDB Cloud**:

```env
# TiDB Cloud Database
DATABASE_HOST=gateway01.us-east-1.prod.awstidclouddb.com
DATABASE_PORT=4000
DATABASE_NAME=barbearia
DATABASE_USER=3YC71VMTZLLsoRE.root
DATABASE_PASSWORD=0c2xmx62M22chFCG

# Server
PORT=5000
NODE_ENV=production
```

Não altere essas variáveis. Se necessário atualizar as credenciais, edite o `.env` e reinicie o servidor.

---

## 🧪 Testes da API

### Usando REST Client (VS Code)

1. Instale a extensão "REST Client" 
2. Abra o arquivo [test.http](test.http)
3. Clique em "Send Request" em cada teste

### Exemplo: Login

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "seu_email@example.com",
  "password": "sua_senha"
}
```

**Resposta:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

Use o `token` para acessar endpoints protegidos:

```http
GET http://localhost:5000/api/services
Authorization: Bearer seu_token_aqui
```

---

## � Endpoints Disponíveis

| Método | Endpoint | Autenticação | Descrição |
|--------|----------|--------------|-----------|
| POST | `/api/auth/login` | ❌ | Login |
| GET | `/api/services` | ✅ | Listar serviços |
| GET | `/api/appointments` | ✅ | Meus agendamentos |
| POST | `/api/appointments` | ✅ | Criar agendamento |
| GET | `/api/user/profile` | ✅ | Perfil do usuário |
| PUT | `/api/user/profile` | ✅ | Atualizar perfil |
| GET | `/api/admin/users` | ✅ | Listar usuários (Admin) |
| GET | `/api/admin/appointments` | ✅ | Listar agendamentos (Admin) |
| GET | `/api/admin/report` | ✅ | Relatório (Admin) |

---

## 📁 Estrutura do Projeto

```
Barbearia/
├── backend/              # API Node.js
│   ├── src/
│   │   ├── index.js
│   │   ├── config/       # Configuração DB
│   │   ├── routes/       # Endpoints
│   │   ├── middleware/   # Autenticação
│   │   └── utils/
│   └── package.json
│
├── android/              # App Android
│   ├── app/src/main/
│   │   ├── java/        # Código Kotlin
│   │   └── res/         # Layouts
│   └── build.gradle
│
├── database/
│   └── schema.sql
│
├── .env                 # TiDB Cloud (já configurado)
└── test.http            # Testes da API
```

---

## 🐛 Troubleshooting

| Erro | Solução |
|------|---------|
| `No token provided` | Use um token válido no header `Authorization: Bearer TOKEN` |
| `Database connection failed` | Verifique `.env` e a conexão com TiDB Cloud |
| `Invalid credentials` | Email/senha incorretos |
| `Port 5000 already in use` | Altere `PORT` no `.env` ou feche o processo |

---

**Desenvolvido para gerenciamento de barbearias** ❤️
