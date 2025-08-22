// Sistema de controle de cabeçalho
class HeaderController {

    constructor() {
        this.header = document.querySelector('header');
        this.mobileToggle = null;
        this.mobileNav = null;
        this.settingsToggle = null;
        this.settingsMenu = null;
        this.dynamicHeaderEnabled = false;
        this.lastScrollY = 0;
        this.scrollThreshold = 100;
        this.isScrolling = false;
        
        this.init();
    }

    init() {
        this.createMobileMenu();
        this.createHeaderSettings();
        this.setupEventListeners();
        this.loadSettings();
    }

    createMobileMenu() {
        // Criar botão de alternância de menu móvel
        const headerRight = document.querySelector('.header-right');
        this.mobileToggle = document.createElement('button');
        this.mobileToggle.className = 'mobile-menu-toggle';
        this.mobileToggle.setAttribute('aria-label', 'Toggle mobile menu');
        this.mobileToggle.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
        
        // Inserir antes das ações do cabeçalho
        const headerActions = document.querySelector('.header-actions');
        headerRight.insertBefore(this.mobileToggle, headerActions);

        // Obtém o elemento de navegação
        this.mobileNav = document.querySelector('.main-nav');
    }

    createHeaderSettings() {
        // Cria painel de configurações
        const settingsPanel = document.createElement('div');
        settingsPanel.className = 'header-settings';
        settingsPanel.innerHTML = `
            <button class="settings-toggle" aria-label="Header settings">
                ⚙️
            </button>
            <div class="settings-menu">
                <div class="settings-option">
                    <label for="dynamic-header">Header Dinâmico</label>
                    <div class="toggle-switch" id="dynamic-header-toggle">
                    </div>
                </div>
                <div class="settings-option">
                    <label for="compact-header">Header Compacto</label>
                    <div class="toggle-switch" id="compact-header-toggle">
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(settingsPanel);

        this.settingsToggle = settingsPanel.querySelector('.settings-toggle');
        this.settingsMenu = settingsPanel.querySelector('.settings-menu');
        this.dynamicToggle = settingsPanel.querySelector('#dynamic-header-toggle');
        this.compactToggle = settingsPanel.querySelector('#compact-header-toggle');
    }

    setupEventListeners() {
        // Alternar menu móvel
        this.mobileToggle.addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // Alternar configurações
        this.settingsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSettings();
        });

        // Alternância dinâmica de cabeçalho
        this.dynamicToggle.addEventListener('click', () => {
            this.toggleDynamicHeader();
        });

        // Alternar cabeçalho compacto
        this.compactToggle.addEventListener('click', () => {
            this.toggleCompactHeader();
        });

        // Feche as configurações ao clicar fora
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.header-settings')) {
                this.closeSettings();
            }
        });

        // Feche o menu móvel ao clicar em links de navegação
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        });

        // Manipulador de rolagem para cabeçalho dinâmico
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (!this.isScrolling) {
                this.isScrolling = true;
            }
            
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.isScrolling = false;
            }, 150);

            this.handleScroll();
        }, { passive: true });

        // Manipulador de redimensionamento
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeMobileMenu();
            }
        });

        // Manipulador de chave de escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
                this.closeSettings();
            }
        });
    }

    toggleMobileMenu() {
        const isActive = this.mobileToggle.classList.contains('active');
        
        if (isActive) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        this.mobileToggle.classList.add('active');
        this.mobileNav.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Gerenciamento de foco
        const firstNavLink = this.mobileNav.querySelector('.nav-link');
        if (firstNavLink) {
            firstNavLink.focus();
        }
    }

    closeMobileMenu() {
        this.mobileToggle.classList.remove('active');
        this.mobileNav.classList.remove('active');
        document.body.style.overflow = '';
    }

    toggleSettings() {
        const isActive = this.settingsMenu.classList.contains('active');
        
        if (isActive) {
            this.closeSettings();
        } else {
            this.openSettings();
        }
    }

    openSettings() {
        this.settingsMenu.classList.add('active');
    }

    closeSettings() {
        this.settingsMenu.classList.remove('active');
    }

    toggleDynamicHeader() {
        this.dynamicHeaderEnabled = !this.dynamicHeaderEnabled;
        this.dynamicToggle.classList.toggle('active', this.dynamicHeaderEnabled);
        
        if (!this.dynamicHeaderEnabled) {
            this.header.classList.remove('header-hidden');
            this.header.classList.add('header-visible');
        }
        
        this.saveSettings();
        this.showNotification(
            this.dynamicHeaderEnabled ? 
            'Header dinâmico ativado' : 
            'Header dinâmico desativado'
        );
    }

    toggleCompactHeader() {
        const isCompact = this.header.classList.contains('compact');
        this.header.classList.toggle('compact', !isCompact);
        this.compactToggle.classList.toggle('active', !isCompact);
        
        this.saveSettings();
        this.showNotification(
            !isCompact ? 
            'Header compacto ativado' : 
            'Header compacto desativado'
        );
    }

    handleScroll() {
        if (!this.dynamicHeaderEnabled) return;

        const currentScrollY = window.scrollY;
        const scrollDifference = Math.abs(currentScrollY - this.lastScrollY);

        // Agir somente se a diferença de rolagem for significativa
        if (scrollDifference < 5) return;

        if (currentScrollY > this.scrollThreshold) {
            if (currentScrollY > this.lastScrollY) {
                // Rolando para baixo - ocultar cabeçalho
                this.header.classList.add('header-hidden');
                this.header.classList.remove('header-visible');
                this.closeMobileMenu();
            } else {
                // Rolar para cima - mostrar cabeçalho
                this.header.classList.remove('header-hidden');
                this.header.classList.add('header-visible');
            }
        } else {
            // Próximo ao topo - sempre mostrar o cabeçalho
            this.header.classList.remove('header-hidden');
            this.header.classList.add('header-visible');
        }

        this.lastScrollY = currentScrollY;
    }

    saveSettings() {
        const settings = {
            dynamicHeader: this.dynamicHeaderEnabled,
            compactHeader: this.header.classList.contains('compact')
        };
        
        localStorage.setItem('headerSettings', JSON.stringify(settings));
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('headerSettings') || '{}');
            
            if (settings.dynamicHeader) {
                this.dynamicHeaderEnabled = true;
                this.dynamicToggle.classList.add('active');
            }
            
            if (settings.compactHeader) {
                this.header.classList.add('compact');
                this.compactToggle.classList.add('active');
            }
        } catch (error) {
            console.warn('Failed to load header settings:', error);
        }
    }

    showNotification(message) {
        // Remover notificação existente
        const existing = document.querySelector('.header-notification');
        if (existing) {
            existing.remove();
        }

        // Criar notificação
        const notification = document.createElement('div');
        notification.className = 'header-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(2, 34, 82, 0.95);
            color: white;
            padding: 0.8rem 1.5rem;
            border-radius: 25px;
            z-index: 1002;
            font-size: 0.9rem;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            opacity: 0;
            transition: all 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Animar em
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(0)';
        });

        // Remover após atraso
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    // Métodos públicos para controle externo
    hideHeader() {
        if (this.dynamicHeaderEnabled) {
            this.header.classList.add('header-hidden');
            this.header.classList.remove('header-visible');
        }
    }

    showHeader() {
        this.header.classList.remove('header-hidden');
        this.header.classList.add('header-visible');
    }

    isHeaderVisible() {
        return !this.header.classList.contains('header-hidden');
    }
}

// Inicializar o controlador de cabeçalho quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.headerController = new HeaderController();
});

// Exportar para uso do módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeaderController;
}