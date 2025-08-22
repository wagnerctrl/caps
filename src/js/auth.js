// Sistema de Autenticação Frontend - usando namespace para evitar conflitos
window.CapacitaAuth = (function() {
    'use strict';
    
    class AuthSystem {
        constructor() {
            this.apiUrl = '/api';
            this.currentUser = null;
            this.token = null;
            this.init();
        }

        init() {
            this.loadStoredAuth();
            this.setupEventListeners();
            this.updateUIBasedOnAuth();
        }

        // Carregar autenticação armazenada
        loadStoredAuth() {
            try {
                const storedUser = localStorage.getItem('capacitaTgUser');
                const storedToken = localStorage.getItem('capacitaTgToken');
                
                if (storedUser && storedToken) {
                    this.currentUser = JSON.parse(storedUser);
                    this.token = storedToken;
                    
                    // Verificar se o token ainda é válido
                    this.validateToken();
                }
            } catch (error) {
                console.error('Erro ao carregar autenticação:', error);
                this.clearAuth();
            }
        }

        // Validar token
        async validateToken() {
            if (!this.token) return false;

            try {
                const response = await fetch(`${this.apiUrl}/profile`, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const userData = await response.json();
                    this.currentUser = userData;
                    this.saveAuth();
                    return true;
                } else {
                    this.clearAuth();
                    return false;
                }
            } catch (error) {
                console.error('Erro ao validar token:', error);
                this.clearAuth();
                return false;
            }
        }

        // Salvar autenticação
        saveAuth() {
            if (this.currentUser && this.token) {
                localStorage.setItem('capacitaTgUser', JSON.stringify(this.currentUser));
                localStorage.setItem('capacitaTgToken', this.token);
            }
        }

        // Limpar autenticação
        clearAuth() {
            this.currentUser = null;
            this.token = null;
            localStorage.removeItem('capacitaTgUser');
            localStorage.removeItem('capacitaTgToken');
            this.updateUIBasedOnAuth();
        }

        // Fazer login
        async login(email, senha) {
            try {
                const response = await fetch(`${this.apiUrl}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, senha })
                });

                const data = await response.json();

                if (response.ok) {
                    this.currentUser = data.user;
                    this.token = data.token;
                    this.saveAuth();
                    this.updateUIBasedOnAuth();
                    return { success: true, message: data.message };
                } else {
                    return { success: false, error: data.error };
                }
            } catch (error) {
                console.error('Erro no login:', error);
                return { success: false, error: 'Erro de conexão. Tente novamente.' };
            }
        }

        // Fazer cadastro de estudante
        async registerStudent(userData) {
            try {
                const response = await fetch(`${this.apiUrl}/students`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });

                const data = await response.json();

                if (response.ok) {
                    this.currentUser = data.user;
                    this.token = data.token;
                    this.saveAuth();
                    this.updateUIBasedOnAuth();
                    return { success: true, message: data.message, user: data.user };
                } else {
                    return { success: false, error: data.error, details: data.details };
                }
            } catch (error) {
                console.error('Erro no cadastro:', error);
                return { success: false, error: 'Erro de conexão. Tente novamente.' };
            }
        }

        // Fazer cadastro de empresa
        async registerCompany(userData) {
            try {
                const response = await fetch(`${this.apiUrl}/companies`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });

                const data = await response.json();

                if (response.ok) {
                    this.currentUser = data.user;
                    this.token = data.token;
                    this.saveAuth();
                    this.updateUIBasedOnAuth();
                    return { success: true, message: data.message, user: data.user };
                } else {
                    return { success: false, error: data.error, details: data.details };
                }
            } catch (error) {
                console.error('Erro no cadastro:', error);
                return { success: false, error: 'Erro de conexão. Tente novamente.' };
            }
        }

        // Fazer logout
        async logout() {
            try {
                if (this.token) {
                    await fetch(`${this.apiUrl}/logout`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                }
            } catch (error) {
                console.error('Erro no logout:', error);
            } finally {
                this.clearAuth();
                // Redirecionar para página inicial
                if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
                    window.location.href = '/index.html';
                }
            }
        }

        // Atualizar perfil
        async updateProfile(updates) {
            if (!this.token) {
                return { success: false, error: 'Usuário não autenticado' };
            }

            try {
                const response = await fetch(`${this.apiUrl}/profile`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updates)
                });

                const data = await response.json();

                if (response.ok) {
                    this.currentUser = data;
                    this.saveAuth();
                    this.updateUIBasedOnAuth();
                    return { success: true, user: data };
                } else {
                    return { success: false, error: data.error };
                }
            } catch (error) {
                console.error('Erro ao atualizar perfil:', error);
                return { success: false, error: 'Erro de conexão. Tente novamente.' };
            }
        }

        // Verificar se está logado
        isLoggedIn() {
            return !!(this.currentUser && this.token);
        }

        // Obter usuário atual
        getCurrentUser() {
            return this.currentUser;
        }

        // Obter tipo de usuário
        getUserType() {
            if (!this.currentUser) return null;
            return this.currentUser.tipo || this.currentUser.tipoUsuario;
        }

        // Atualizar UI baseada na autenticação
        updateUIBasedOnAuth() {
            this.updateHeaderButtons();
            this.updateUserDisplays();
        }

        // Atualizar botões do header
        updateHeaderButtons() {
            const headerLoginBtn = document.getElementById('headerLoginBtn');
            const mobileLoginBtn = document.getElementById('mobileLoginBtn');
            
            if (this.isLoggedIn()) {
                const userName = this.getUserDisplayName();
                const userType = this.getUserTypeDisplay();
                
                const userHtml = `
                    <div class="user-info-header">
                        <span class="user-name-header">${userName}</span>
                        <span class="user-type-header">${userType}</span>
                    </div>
                `;
                
                if (headerLoginBtn) {
                    headerLoginBtn.innerHTML = userHtml;
                    headerLoginBtn.classList.add('logged-in');
                }
                
                if (mobileLoginBtn) {
                    mobileLoginBtn.innerHTML = userHtml;
                    mobileLoginBtn.classList.add('logged-in');
                }
            } else {
                if (headerLoginBtn) {
                    headerLoginBtn.textContent = 'Acessar';
                    headerLoginBtn.classList.remove('logged-in');
                }
                
                if (mobileLoginBtn) {
                    mobileLoginBtn.textContent = 'Acessar';
                    mobileLoginBtn.classList.remove('logged-in');
                }
            }
        }

        // Atualizar exibições de usuário
        updateUserDisplays() {
            // Atualizar modais e outras exibições de usuário
            const modalUserName = document.getElementById('modalUserName');
            const modalUserEmail = document.getElementById('modalUserEmail');
            const modalUserType = document.getElementById('modalUserType');
            
            if (this.isLoggedIn() && modalUserName && modalUserEmail && modalUserType) {
                modalUserName.textContent = this.currentUser.nome || this.currentUser.nomeEmpresa;
                modalUserEmail.textContent = this.currentUser.email;
                modalUserType.textContent = this.getUserTypeDisplay();
            }
        }

        // Obter nome para exibição
        getUserDisplayName() {
            if (!this.currentUser) return '';
            
            const fullName = this.currentUser.nome || this.currentUser.nomeEmpresa || '';
            const nameParts = fullName.split(' ');
            
            if (nameParts.length >= 2) {
                return `${nameParts[0]} ${nameParts[1]}`;
            }
            
            return nameParts[0] || '';
        }

        // Obter tipo de usuário para exibição
        getUserTypeDisplay() {
            if (!this.currentUser) return '';
            
            const userType = this.currentUser.tipo || this.currentUser.tipoUsuario;
            
            switch (userType) {
                case 'atirador':
                    return 'Aluno';
                case 'empresa':
                case 'empregador':
                    return 'Empresa';
                default:
                    return 'Usuário';
            }
        }

        // Configurar event listeners
        setupEventListeners() {
            // Event listeners para botões de login
            document.addEventListener('click', (e) => {
                if (e.target.id === 'headerLoginBtn' || e.target.id === 'mobileLoginBtn') {
                    this.handleLoginButtonClick(e);
                }
            });

            // Event listener para logout
            document.addEventListener('click', (e) => {
                if (e.target.id === 'confirmLogout' || e.target.classList.contains('logout-btn')) {
                    e.preventDefault();
                    this.logout();
                }
            });
        }

        // Lidar com clique no botão de login
        handleLoginButtonClick(e) {
            if (this.isLoggedIn()) {
                // Se logado, mostrar modal de perfil
                e.preventDefault();
                this.showUserProfileModal();
            } else {
                // Se não logado, redirecionar para página de login
                window.location.href = '/entrar.html';
            }
        }

        // Mostrar modal de perfil do usuário
        showUserProfileModal() {
            const modal = document.getElementById('userProfileModal');
            if (modal) {
                this.updateUserDisplays();
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }

        // Fazer requisição autenticada
        async authenticatedRequest(url, options = {}) {
            if (!this.token) {
                throw new Error('Usuário não autenticado');
            }

            const headers = {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
                ...options.headers
            };

            const response = await fetch(url, {
                ...options,
                headers
            });

            if (response.status === 401) {
                // Token expirado ou inválido
                this.clearAuth();
                throw new Error('Sessão expirada. Faça login novamente.');
            }

            return response;
        }
    }

    // Instância única do sistema de autenticação
    const authInstance = new AuthSystem();

    // API pública
    return {
        login: (email, senha) => authInstance.login(email, senha),
        logout: () => authInstance.logout(),
        registerStudent: (userData) => authInstance.registerStudent(userData),
        registerCompany: (userData) => authInstance.registerCompany(userData),
        updateProfile: (updates) => authInstance.updateProfile(updates),
        isLoggedIn: () => authInstance.isLoggedIn(),
        getCurrentUser: () => authInstance.getCurrentUser(),
        getUserType: () => authInstance.getUserType(),
        authenticatedRequest: (url, options) => authInstance.authenticatedRequest(url, options)
    };
})();

// Instância global para compatibilidade
window.authSystem = window.CapacitaAuth;