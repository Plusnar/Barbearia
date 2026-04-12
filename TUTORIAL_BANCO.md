# 🚀 Like I'm 5 - Como Conectar ao Banco de Dados

## ✅ Você tem essas 3 coisas?

Antes de tudo, verifique:
- [ ] Node.js instalado (Se não tem, baixa aqui: https://nodejs.org/)
- [ ] Projeto Barbearia aberto no VS Code
- [ ] Conexão com internet

---

## 📖 Passo 1: Abra o Terminal

**No VS Code:**

1. Clique em: `Terminal` (no menu superior)
2. Clique em: `New Terminal` 
3. Aparece uma caixa preta embaixo da tela = Terminal aberto ✅

---

## 📖 Passo 2: Vá para a Pasta do Backend

**No terminal (caixa preta), digite:**

```
cd backend
```

**Depois aperte:** ENTER

Você vai ver:
```
C:\Users\[seu nome]\...\Barbearia\backend>
```

---

## 📖 Passo 3: Instale as Coisas Necessárias (PRIMEIRA VEZ APENAS)

**No terminal, digite:**

```
npm install
```

**Depois aperte:** ENTER

Vai aparecer muita coisa na tela (não se assusta). Espera até terminar.

Pronto quando aparecer:
```
added XX packages in XXs
```

---

## 📖 Passo 4: Inicie o Servidor

**No terminal, digite:**

```
node src/index.js
```

**Depois aperte:** ENTER

**Se aparecer isso = PERFEITO ✅:**

```
✅ Conectado ao TiDB Cloud com sucesso!
Database connected successfully
Server is running on port 5000
```

---

## ⚠️ Se Não Funcionou?

### Erro: "Cannot find module"

**Faça isso:**
```
npm install
```

Depois tenta de novo:
```
node src/index.js
```

---

### Erro: "Porta 5000 já em uso"

Significa que o servidor já está rodando em outra janela.

**Solução:** Feche a outra janela do terminal.

---

### Não conecta ao banco?

Verifique o arquivo `backend/.env`

Abra procurando `backend` > `.env`

Deve ter:
```
DATABASE_HOST=gateway01.us-east-1.prod.aws.tidbcloud.com
DATABASE_PORT=4000
DATABASE_NAME=barbearia
DATABASE_USER=3YC71VMTZLLsoRE.root
DATABASE_PASSWORD=gQ6kW9eJReKHNVNs
```

Se estiver diferente, peça para o responsável corrigir.

---

## 📊 Ver os Dados (Quando servidor está rodando)

**Abra OUTRO terminal** (deixe o servidor rodando):

1. `Terminal` > `New Terminal`
2. No novo terminal, digite:

```
cd backend
node check-users.js
```

Vai aparecer uma tabela com todos os usuários. ✅

---

## 🧪 Testar Requisições

**Abra o arquivo:** `test.http`

Na tela, você vai ver:

```
### Login - Cliente
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "joao@test.com",
  "password": "123456"
}
```

**Clique em:** `Send Request` (azul claro acima do código)

Se aparecer com `"success": true` = Funcionou! ✅

---

## 📝 Resumão Super Rápido

| O que fazer | Comando |
|-------------|---------|
| Instalar (primeira vez) | `npm install` |
| Ligar servidor | `node src/index.js` |
| Ver usuários | `node check-users.js` |
| Ver estrutura do banco | Abra `database/TIDB_QUERIES.sql` |

---

## 🆘 Dúvidas Frequentes

**P: Preciso instalar npm?**  
R: Não, vem com Node.js. Se Node.js está instalado, npm já tem.

**P: Preciso fazer isso toda vez?**  
R: `npm install` = só primeira vez. `node src/index.js` = toda vez que quer ligar o servidor.

**P: Posso fechar o terminal com o servidor?**  
R: Não! O servidor para. Deixe rodando enquanto trabalha.

**P: Perdi a senha do banco?**  
R: Está em `backend/.env`, na linha `DATABASE_PASSWORD`.

**P: O servidor ficou lento/com erro?**  
R: Feche com `Ctrl+C` e abre de novo com `node src/index.js`.

---

## ✅ Tá Funcionando Quando:

- ✅ Terminal mostra "✅ Conectado ao TiDB Cloud com sucesso!"
- ✅ `node check-users.js` mostra tabela com usuários
- ✅ `Send Request` no test.http retorna dados

---

é isso! 🎯
