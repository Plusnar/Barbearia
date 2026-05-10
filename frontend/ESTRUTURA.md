# Estrutura Modular do Frontend

## Arquivos Principais

### `demo.html`
- Arquivo HTML principal que orquestra toda a aplicação
- Importa o CSS externo e o JavaScript de lógica
- Mantém a estrutura do layout (phone device + workspace)
- Não contém estilos ou lógica JavaScript (apenas referências)

### `styles.css`
- Todos os estilos da aplicação em um arquivo separado
- Variáveis CSS (cores, espaçamentos, etc.)
- Media queries e responsividade
- Fácil de manter e atualizar temas

### `app.js`
- Toda a lógica JavaScript da aplicação
- Funções de API (`api()`, `login`, `register`, `booking`, etc.)
- Event listeners para formulários e botões
- Renderização dinâmica de conteúdo
- Gerenciamento de estado (token, usuário, etc.)

## Componentes HTML

Localizados em `components/`, cada arquivo representa uma seção específica da interface:

### `components/auth.html`
- Painel de autenticação (login e registro)
- Formulários com validação
- Status de autenticação

### `components/session.html`
- Painel de dados do usuário autenticado
- Botões de atualizar dados e logout
- Informações do perfil

### `components/customer.html`
- Agendamento do cliente
- Formulário com seleção de serviço, barbeiro, data e hora
- Lista de agendamentos do cliente

### `components/barber.html`
- Agenda do barbeiro
- Lista de agendamentos com opção de atualizar status
- Ações: Confirmar, Concluir, Cancelar

### `components/admin.html`
- Dashboard de administrador
- Métricas: Total de agendamentos, receita, clientes
- Distribuição de lucro com cálculo de comissão
- Lista de todos os agendamentos

## Como Adicionar Novas Funcionalidades

1. **Novo estilo CSS**: Adicione em `styles.css`
2. **Novo componente HTML**: Crie em `components/` com um nome descritivo
3. **Nova lógica JavaScript**: Adicione funções em `app.js`
4. **Novo elemento no HTML**: Integre em `demo.html` mantendo a estrutura

## Fluxo de Funcionamento

```
demo.html (estrutura)
    ↓
styles.css (estilo)
    ↓
app.js (lógica)
    ↓
components/ (referência de cada seção)
```

## Benefícios da Modularização

- ✅ Fácil manutenção de estilos
- ✅ Lógica JavaScript centralizada
- ✅ Componentes HTML bem definidos
- ✅ Sem alteração da funcionalidade original
- ✅ Melhor organização do código
- ✅ Facilita trabalho em equipe
