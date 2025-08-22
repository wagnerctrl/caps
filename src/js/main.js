// Sistema principal - inicialização modular
(function() {
  'use strict';
  
  // Aguardar carregamento completo do DOM
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
      initializeApp();
  }
  
  function initializeApp() {
      // Inicializar navegação se o módulo estiver disponível
      if (typeof initNavigation === 'function') {
          initNavigation();
      }
      
      // Configurar smooth scroll para links internos
      setupSmoothScroll();
      
      // Configurar animações de entrada
      setupScrollAnimations();
  }
  
  function setupSmoothScroll() {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
          anchor.addEventListener('click', function(e) {
              const href = this.getAttribute('href');
              if (href.length > 1) { 
                  e.preventDefault();
                  const target = document.querySelector(href);
                  if (target) {
                      const headerHeight = document.querySelector('header').offsetHeight;
                      const targetPosition = target.offsetTop - headerHeight - 20;

                      window.scrollTo({
                          top: targetPosition,
                          behavior: 'smooth'
                      });
                  }
              }
          });
      });
  }
  
  function setupScrollAnimations() {
      const animateOnScroll = (elements, className) => {
          const observer = new IntersectionObserver((entries) => {
              entries.forEach(entry => {
                  if (entry.isIntersecting) {
                      entry.target.classList.add(className);
                      observer.unobserve(entry.target);
                  }
              });
          }, { threshold: 0.1 });

          elements.forEach(el => observer.observe(el));
      };

      // Animar cards ao aparecer na tela
      animateOnScroll(document.querySelectorAll('.course-card'), 'animate-card');
      animateOnScroll(document.querySelectorAll('.custom-images-container img'), 'animate-slide');
  }
})();