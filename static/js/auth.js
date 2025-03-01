class Auth {
    constructor() {
        this.isAuthenticated = false;
        this.user = null;
        this.initializeAuth();
        this.setupEventListeners();
    }

    initializeAuth() {
        // Check local storage for auth state
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
            this.isAuthenticated = true;
            this.user = JSON.parse(user);
            this.updateUIForAuth();
        }
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Switch links
        const switchToRegister = document.getElementById('switch-to-register');
        const switchToLogin = document.getElementById('switch-to-login');
        
        if (switchToRegister) {
            switchToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('login-modal');
                this.showModal('register-modal');
            });
        }
        
        if (switchToLogin) {
            switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('register-modal');
                this.showModal('login-modal');
            });
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: formData.get('email'),
                    password: formData.get('password')
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.setAuthState(data);
                this.hideModal('login-modal');
                this.showMessage('Login successful!');
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Login failed', 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        // Validate passwords match
        if (formData.get('password') !== formData.get('confirm')) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: formData.get('email'),
                    username: formData.get('username'),
                    password: formData.get('password')
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.setAuthState(data);
                this.hideModal('register-modal');
                this.showMessage('Registration successful!');
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showMessage('Registration failed', 'error');
        }
    }

    setAuthState(data) {
        this.isAuthenticated = true;
        this.user = data.user;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        this.updateUIForAuth();
    }

    updateUIForAuth() {
        // Update UI elements based on auth state
        document.querySelectorAll('.auth-hide').forEach(el => {
            el.style.display = this.isAuthenticated ? 'none' : 'block';
        });
        
        document.querySelectorAll('.auth-show').forEach(el => {
            el.style.display = this.isAuthenticated ? 'block' : 'none';
        });
        
        // Update profile if authenticated
        if (this.isAuthenticated && this.user) {
            const username = document.getElementById('profile-username');
            const email = document.getElementById('profile-email');
            
            if (username) username.textContent = this.user.username;
            if (email) email.textContent = this.user.email;
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('visible');
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('visible');
    }

    showMessage(message, type = 'success') {
        const container = document.getElementById('message-container');
        if (!container) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        container.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new Auth();
});
