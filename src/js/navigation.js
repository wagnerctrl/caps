// Sistema de navegação - usando padrão de módulo revelador
window.NavigationModule = (function() {
  'use strict';
  
  // Estado de navegação
  let currentPage = '';
  let navigationInProgress = false;

  // Cache for loaded pages with expiration
  const pageCache = new Map();
  const CACHE_EXPIRATION = 30 * 60 * 1000; // 30 minutes

  // Classe de link ativo
  const ACTIVE_CLASS = 'nav-link-active';

  // Mapa de rotas válidas
  const routes = {
      'index.html': '/',
      'entrar.html': '/entrar',
      'empreend.html': '/empreend',
      'financ.html': '/financ',
      'novoemp.html': '/novoemp',
      'parceiros.html': '/parceiros',
      'primeiroemprego.html': '/primeiro-emprego',
      'habitos.html': '/habitos-saudaveis'
  };

  // Inicializar o sistema de navegação
  function initNavigation() {
      // Lidar com o carregamento inicial da página
      handleCurrentPage();
      
      // Adicionar manipuladores de clique a todos os links de navegação
      document.querySelectorAll('a').forEach(link => {
          const href = link.getAttribute('href');
          if (href && isInternalLink(href)) {
              link.addEventListener('click', handleNavigation);
          }
      });

      // Lidar com os botões de voltar/avançar do navegador
      window.addEventListener('popstate', handlePopState);
      
      // Limpar o cache expirado periodicamente
      setInterval(cleanExpiredCache, CACHE_EXPIRATION);
  }

  // Limpar entradas expiradas do cache
  function cleanExpiredCache() {
      const now = Date.now();
      for (const [key, value] of pageCache.entries()) {
          if (now - value.timestamp > CACHE_EXPIRATION) {
              pageCache.delete(key);
          }
      }
  }

  // Lidar com eventos de clique de navegação
  async function handleNavigation(e) {
      if (navigationInProgress) return;
      
      const link = e.currentTarget;
      const href = link.getAttribute('href');

      // Ignorar se for um link âncora
      if (href.startsWith('#')) return;

      e.preventDefault();
      navigationInProgress = true;

      try {
          await navigateToPage(href);
      } catch (error) {
          console.error('Erro de navegação:', error);
          showErrorMessage('Não foi possível carregar a página. Por favor, tente novamente.');
      } finally {
          navigationInProgress = false;
      }
  }

  // Navegar para uma nova página
  async function navigateToPage(path) {
      // Mostrar estado de carregamento
      document.body.classList.add('navigation-loading');
      
      try {
          // Obter conteúdo da página
          const content = await loadPage(path);
          
          // Atualizar URL e histórico
          const newUrl = getRouteUrl(path);
          window.history.pushState({ path, timestamp: Date.now() }, '', newUrl);

          // Atualizar conteúdo da página
          await updatePageContent(content);
          
          // Atualizar link ativo
          updateActiveLink(path);

          // Rolar para o topo com comportamento suave
          window.scrollTo({
              top: 0,
              behavior: 'smooth'
          });
          
          // Disparar evento personalizado para mudança de página
          window.dispatchEvent(new CustomEvent('pageChanged', {
              detail: { path }
          }));
      } finally {
          // Remover estado de carregamento
          document.body.classList.remove('navigation-loading');
      }
  }

  // Carregar conteúdo da página com cache
  async function loadPage(path) {
      const now = Date.now();
      
      // Verificar o cache primeiro
      if (pageCache.has(path)) {
          const cached = pageCache.get(path);
          if (now - cached.timestamp < CACHE_EXPIRATION) {
              return cached.content;
          }
      }

      // Carregar página com timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000); // Timeout de 8s

      try {
          const response = await fetch(path, {
              signal: controller.signal,
              headers: { 'X-Requested-With': 'XMLHttpRequest' }
          });
          
          clearTimeout(timeout);
          
          if (!response.ok) {
              throw new Error(`Falha ao carregar a página: ${response.status} ${response.statusText}`);
          }

          const html = await response.text();
          
          // Armazenar no cache o resultado com timestamp
          pageCache.set(path, {
              content: html,
              timestamp: now
          });
          
          return html;
      } catch (error) {
          clearTimeout(timeout);
          throw error;
      }
  }

  // Atualizar conteúdo da página de forma segura
  async function updatePageContent(html) {
      // Criar elemento temporário para analisar o HTML
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      // Atualizar conteúdo principal com transição
      const newMain = doc.querySelector('main');
      const currentMain = document.querySelector('main');
      
      if (newMain && currentMain) {
          // Adicionar transição de fade-out
          currentMain.style.opacity = '0';
          currentMain.style.transition = 'opacity 0.3s ease';
          
          // Aguardar a conclusão da transição
          await new Promise(resolve => {
              currentMain.addEventListener('transitionend', resolve, { once: true });
              setTimeout(resolve, 300); // Fallback
          });
          
          // Substituir conteúdo
          currentMain.innerHTML = newMain.innerHTML;
          
          // Fade-in do novo conteúdo
          currentMain.style.opacity = '1';
      }

      // Atualizar título
      if (doc.title) {
          document.title = doc.title;
      }

      // Lidar com scripts de forma segura
      await handleScripts(doc);
  }

  // Lidar com scripts de forma segura
  async function handleScripts(doc) {
      const scripts = Array.from(doc.querySelectorAll('script'));
      
      for (const script of scripts) {
          if (script.src) {
              // Carregar script externo (evitar duplicados)
              if (!document.querySelector(`script[src="${script.src}"]`)) {
                  await loadExternalScript(script.src);
              }
          } else {
              // Executar script inline de forma segura
              executeInlineScript(script.textContent);
          }
      }
  }

  // Carregar script externo
  function loadExternalScript(src) {
      return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
      });
  }

  // Executar script inline de forma segura
  function executeInlineScript(code) {
      try {
          // Alternativas mais seguras ao eval
          const script = document.createElement('script');
          script.textContent = code;
          document.body.appendChild(script);
          document.body.removeChild(script);
      } catch (error) {
          console.error('Erro ao executar script inline:', error);
      }
  }

  // Atualizar link ativo na navegação
  function updateActiveLink(path) {
      // Remover classe ativa de todos os links
      document.querySelectorAll(`.${ACTIVE_CLASS}`).forEach(link => {
          link.classList.remove(ACTIVE_CLASS);
      });

      // Adicionar classe ativa aos links da página atual
      const currentLinks = document.querySelectorAll(`a[href="${path}"]`);
      currentLinks.forEach(link => {
          link.classList.add(ACTIVE_CLASS);
          link.setAttribute('aria-current', 'page');
      });
      
      // Remover aria-current de outros links
      document.querySelectorAll(`a:not([href="${path}"])`).forEach(link => {
          link.removeAttribute('aria-current');
      });
  }

  // Lidar com voltar/avançar do navegador
  async function handlePopState(e) {
      if (e.state?.path && e.state.path !== currentPage) {
          try {
              await navigateToPage(e.state.path);
          } catch (error) {
              console.error('Erro de navegação popstate:', error);
              window.location.reload(); // Fallback para recarregar completamente
          }
      }
  }

  // Lidar com o carregamento inicial da página
  function handleCurrentPage() {
      const path = window.location.pathname;
      currentPage = getPagePath(path);
      updateActiveLink(currentPage);
  }

  // Helper para verificar se o link é interno
  function isInternalLink(href) {
      if (!href) return false;
      if (href.startsWith('#')) return false;
      if (href.startsWith('http')) {
          return href.includes(window.location.host);
      }
      return true;
  }

  // Obter URL da rota a partir do caminho da página
  function getRouteUrl(path) {
      return routes[path] || path;
  }

  // Obter caminho da página a partir da URL da rota
  function getPagePath(route) {
      const entry = Object.entries(routes).find(([_, value]) => value === route);
      return entry ? entry[0] : route;
  }

  // Mostrar mensagem de erro com feedback na interface
  function showErrorMessage(message) {
      const errorElement = document.createElement('div');
      errorElement.className = 'navigation-error';
      errorElement.innerHTML = `
          <div class="error-content">
              <p>${message}</p>
              <button class="error-close">OK</button>
          </div>
      `;
      
      errorElement.querySelector('.error-close').addEventListener('click', () => {
          document.body.removeChild(errorElement);
      });
      
      document.body.appendChild(errorElement);
  }

  // API pública do módulo
  return {
      init: initNavigation,
      navigateTo: navigateToPage,
      getCurrentPage: () => currentPage,
      isNavigating: () => navigationInProgress
  };
})();

// Função global para compatibilidade
window.initNavigation = window.NavigationModule.init;