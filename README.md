# 🏳️ Barbearia - Barbershop Management System

Sistema completo de gerenciamento de barbearia com backend em **Node.js** e app mobile **Android**.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
4. [Instalação e Execução](#instalação-e-execução)
5. [Testes da API](#testes-da-api)
6. [Estrutura do Projeto](#estrutura-do-projeto)
7. [Endpoints Disponíveis](#endpoints-disponíveis)

---

## 🎯 Visão Geral

Sistema de agendamento de barbearia com:
- **Backend**: API REST em Node.js com Express
- **Banco de Dados**: TiDB Cloud (MySQL compatible)
- **Frontend Mobile**: Android Kotlin
- **Autenticação**: JWT (JSON Web Tokens)

---

## 📦 Pré-requisitos

Instale antes de começar:

| Ferramenta | Versão | Download |
|-----------|--------|----------|
| Node.js | 18+ | https://nodejs.org/ |
| Git | Qualquer | https://git-scm.com/ |
| Android Studio | Recente | https://developer.android.com/ |

---

## 🔗 Configuração do Banco de Dados

### Opção 1: TiDB Cloud (Recomendado) ⭐

#### Passo 1: Criar Cluster no TiDB Cloud
1. Acesse: https://tidbcloud.com
2. Crie uma conta ou faça login
3. Crie um novo cluster
4. Copie as credenciais fornecidas

#### Passo 2: Configurar as Variáveis de Ambiente

Abra o arquivo `.env` e configure:

```env
# MySQL Database Configuration
DATABASE_HOST=gateway01.us-east-1.prod.awstidclouddb.com
DATABASE_PORT=4000
DATABASE_NAME=barbearia
DATABASE_USER=3YC71VMTZLLsoRE.root
DATABASE_PASSWORD=0c2xmx62M22chFCG

# Server Configuration
PORT=5000
NODE_ENV=production
```

#### Passo 3: Importar Schema do Banco

```bash
# O schema será automaticamente criado quando o backend iniciar
# OU manualmente via ferramentas como DBeaver, MySQL Workbench, etc.
```

---

### Opção 2: XAMPP Local (Para Desenvolvimento Local)

#### Passo 1: Instalar XAMPP
1. Baixe: https://www.apachefriends.org/
2. Execute e instale

#### Passo 2: Iniciar XAMPP
1. Abra **XAMPP Control Panel**
2. Clique em **Start** no Apache e MySQL

#### Passo 3: Acessar phpMyAdmin
1. Abra: `http://localhost/phpmyadmin`
2. Login: `root` (sem senha)

#### Passo 4: Importar Schema
1. Crie um banco chamado `barbearia`
2. Vá em **Importar**
3. Selecione `database/schema.sql`
4. Clique em **Executar**

#### Passo 5: Configurar .env
```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=barbearia
DATABASE_USER=root
DATABASE_PASSWORD=
PORT=5000
NODE_ENV=development
```

---

## 🚀 Instalação e Execução

### Backend Node.js

```bash
# Navegue até a pasta backend
cd backend

# Instale as dependências
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

# Configure o emulador ou conecte um dispositivo físico
# Clique em "Run" (▶️)
```

---

## 🧪 Testes da API

### Usando REST Client (VS Code)

1. Instale a extensão "REST Client"
2. Abra o arquivo [test.http](test.http)
3. Clique em "Send Request" em cada teste

### Endpoints Públicos (SEM Token)

#### 📝 Registrar Novo Usuário

```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@test.com",
  "phone": "11999999999",
  "password": "123456",
  "role": "customer"
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "name": "João Silva",
    "email": "joao@test.com",
    "phone": "11999999999",
    "role": "customer"
  }
}
```

#### 🔐 Login

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "joao@test.com",
  "password": "123456"
}
```

---

### Endpoints Protegidos (COM Token)

Para todos esses endpoints, adicione o header:
```
Authorization: Bearer SEU_TOKEN_JWT
```

#### 📋 Listar Serviços

```http
GET http://localhost:5000/api/services
Authorization: Bearer seu_token_aqui
```

#### 📅 Listar Meus Agendamentos

```http
GET http://localhost:5000/api/appointments
Authorization: Bearer seu_token_aqui
```

#### ➕ Criar Novo Agendamento

```http
POST http://localhost:5000/api/appointments
Content-Type: application/json
Authorization: Bearer seu_token_aqui

{
  "barberId": 1,
  "serviceId": 1,
  "appointmentDate": "2026-04-15",
  "appointmentTime": "10:00"
}
```

#### 👤 Obter Perfil do Usuário

```http
GET http://localhost:5000/api/user/profile
Authorization: Bearer seu_token_aqui
```

#### 📊 Painel Administrativo (Admin only)

```http
GET http://localhost:5000/api/admin/users
Authorization: Bearer seu_token_admin_aqui
```

---

## 📁 Estrutura do Projeto

```
Barbearia/
├── backend/                    # API Node.js
│   ├── src/
│   │   ├── index.js           # Arquivo principal
│   │   ├── config/
│   │   │   └── database.js    # Configuração TiDB/MySQL
│   │   ├── routes/            # Endpoints da API
│   │   │   ├── auth.js
│   │   │   ├── appointments.js
│   │   │   ├── services.js
│   │   │   ├── users.js
│   │   │   └── admin.js
│   │   ├── middleware/
│   │   │   └── auth.js        # Autenticação JWT
│   │   └── utils/             # Funções auxiliares
│   ├── package.json
│   └── .env                   # Variáveis de ambiente
│
├── android/                    # App Android
│   ├── app/
│   │   └── src/main/
│   │       ├── java/          # Código Kotlin
│   │       └── res/           # Recursos (layouts, drawables)
│   └── build.gradle
│
├── database/
│   └── schema.sql             # Schema do banco
│
├── .env.example               # Exemplo de variáveis
├── test.http                  # Testes da API
└── README.md                  # Este arquivo
```

---

## 🔌 Endpoints Disponíveis

| Método | Endpoint | Autenticação | Descrição |
|--------|----------|--------------|-----------|
| POST | `/api/auth/register` | ❌ | Registrar novo usuário |
| POST | `/api/auth/login` | ❌ | Fazer login |
| GET | `/api/services` | ✅ | Listar serviços |
| GET | `/api/appointments` | ✅ | Listar meus agendamentos |
| POST | `/api/appointments` | ✅ | Criar novo agendamento |
| GET | `/api/user/profile` | ✅ | Dados do usuário |
| PUT | `/api/user/profile` | ✅ | Atualizar dados |
| GET | `/api/admin/users` | ✅ | Listar todos os usuários |
| GET | `/api/admin/appointments` | ✅ | Listar todos os agendamentos |
| GET | `/api/admin/report` | ✅ | Gerar relatório |

---

## 🐛 Troubleshooting

### Erro: "No token provided"
- **Causa**: Endpoint protegido acessado sem token
- **Solução**: Faça login primeiro, copie o token e adicione no header `Authorization: Bearer TOKEN`

### Erro: "Database connection failed"
- **Causa**: Credenciais incorretas ou banco offline
- **Solução**: Verifique `.env` e se o TiDB Cloud/MySQL está rodando

### Erro: "Invalid credentials"
- **Causa**: Email e/ou senha incorretos
- **Solução**: Verifique se o usuário existe e a senha está correta

---

## 📚 Recursos Úteis

- [TiDB Cloud Documentation](https://docs.tidbcloud.com/)
- [Express.js Documentation](https://expressjs.com/)
- [Android Development](https://developer.android.com/)
- [JWT Documentation](https://jwt.io/)

---

## 📝 Licença

ISC

---

**Desenvolvido com ❤️ para gerenciamento de barbearias**
