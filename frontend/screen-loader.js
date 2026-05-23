/**
 * Screen Loader - Carrega telas HTML separadas dinamicamente
 * Executa após o DOM estar pronto
 */
async function loadScreens() {
  const appShell = document.querySelector('.app-shell');
  
  // Telas principais (carregadas no app-shell)
  const screens = [
    'screens/welcome-screen.html',
    'screens/auth-screen.html',
    'screens/dashboard-screen.html'
  ];

  // Carrega telas principais
  for (const screenFile of screens) {
    try {
      const response = await fetch(screenFile);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      appShell.insertAdjacentHTML('beforeend', html);
    } catch (error) {
      console.error(`Erro ao carregar ${screenFile}:`, error);
    }
  }

  // Aguarda um pouco para garantir que o dashboard foi inserido
  await new Promise(resolve => setTimeout(resolve, 0));

  // Carrega views como filhos do dashboardScreen
  const dashboardScreen = document.getElementById('dashboardScreen');
  if (dashboardScreen) {
    const views = [
      'screens/customer-view.html',
      'screens/barber-view.html',
      'screens/admin-view.html'
    ];

    for (const viewFile of views) {
      try {
        const response = await fetch(viewFile);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = await response.text();
        dashboardScreen.insertAdjacentHTML('beforeend', html);
      } catch (error) {
        console.error(`Erro ao carregar ${viewFile}:`, error);
      }
    }
  }

  // Carrega app.js dinamicamente APÓS telas estarem prontas
  const appScript = document.createElement('script');
  appScript.src = 'app.js';
  document.body.appendChild(appScript);
}

// Carregar telas quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadScreens);
} else {
  loadScreens();
}
