# Refatoração - Separação de Telas

## Objetivo
Separar as 6 telas do projeto de um único `index.html` para arquivos individuais, facilitando manutenção e organização do código.

## Estrutura Anterior
```
frontend/
├── index.html          (continha todas as 6 telas em sections)
├── app.js              (lógica e navegação)
├── styles.css          (estilos únicos)
```

## Estrutura Nova
```
frontend/
├── index.html          (estrutura base minificada)
├── app.js              (lógica - sem alterações)
├── screen-loader.js    (carregador de telas)
├── styles.css          (estilos - sem alterações)
├── screens/
│   ├── welcome-screen.html      (tela inicial)
│   ├── auth-screen.html         (login/registro/recuperação)
│   ├── dashboard-screen.html    (base do dashboard)
│   ├── customer-view.html       (vista cliente)
│   ├── barber-view.html         (vista barbeiro)
│   └── admin-view.html          (vista admin com 5 abas)
```

## Como Funciona

### Fluxo de Carregamento
1. **index.html** carrega (contém apenas app-shell vazio)
2. **screen-loader.js** executa e faz fetch dos 6 arquivos HTML
3. Cada arquivo é inserido no `.app-shell` via `insertAdjacentHTML()`
4. Após todas as telas serem carregadas, `startApp()` é chamado
5. **app.js** executa, attachando todos os event listeners
6. `renderSession()` é chamado, mostrando a tela apropriada

### Sem Alterações
- `app.js` continua 100% igual
- `styles.css` continua 100% igual
- Toda lógica de navegação funciona normalmente
- IDs e classes mantêm-se iguais

## Vantagens
✅ **Manutenibilidade**: Cada tela em arquivo separado
✅ **Organização**: Melhor estrutura de pastas
✅ **Limpeza**: index.html legível e minimalista
✅ **Compatibilidade**: Funcionalidade não afetada
✅ **Escalabilidade**: Fácil adicionar/modificar telas

## Telas Separadas

### 1. welcome-screen.html
- Tela splash inicial
- Clique → chama `startApp()`

### 2. auth-screen.html
- 3 formulários: Login, Registro, Recuperação de Senha
- Tabs para alternar entre formulários

### 3. dashboard-screen.html
- Header com infos do usuário
- Session strip
- Account panel (compartilhado)
- Placehold para views por role

### 4. customer-view.html
- Formulário de agendamento
- Lista de agendamentos do cliente

### 5. barber-view.html
- 3 métricas (Pendentes, Concluídos, Receita)
- Agenda com botões (Confirmar, Realizado, Cancelar)

### 6. admin-view.html
- 4 métricas (Agendamentos, Cortes, Receita, Clientes)
- 5 abas: Conta, Lucro, Barbeiros, Serviços, Agenda
- Todos os formulários admin

## Testes Recomendados
1. ✓ Pagina carrega sem erros
2. ✓ Welcome screen aparece
3. ✓ Clique → Auth screen
4. ✓ Login funciona
5. ✓ Dashboard por role (customer/barber/admin)
6. ✓ Todas as abas admin funcionam
7. ✓ Formulários funcionam
8. ✓ Logout funciona

## Notas Técnicas
- Loader usa fetch() para carregar HTMLs
- Fallback: Se arquivo não carregar, erro é logado mas app continua
- Performance: Carregamento paralelo é possível em navegadores modernos
- Compatibilidade: Funciona em todos os navegadores com suporte a fetch/ES6
