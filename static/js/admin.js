class AdminManager {
    constructor() {
        this.isAdmin = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Admin form submission
        const adminForm = document.getElementById('admin-form');
        if (adminForm) {
            adminForm.addEventListener('submit', (e) => this.handleAdminLogin(e));
        }

        // Admin button click
        const adminButton = document.getElementById('admin-button');
        if (adminButton) {
            adminButton.addEventListener('click', () => this.showAdminModal());
        }

        // Close button
        const closeButton = document.getElementById('close-admin-modal');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.hideAdminModal());
        }
    }

    async handleAdminLogin(e) {
        e.preventDefault();
        const password = document.getElementById('admin-password').value;

        try {
            const response = await fetch('/api/admin/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.isAdmin = true;
                this.hideAdminModal();
                this.updateUIForAdmin();
                this.showMessage('Admin access granted');
                
                // Refresh calendar with admin view
                if (window.calendar) {
                    window.calendar.renderCalendar(true);
                }
            } else {
                throw new Error(data.message || 'Invalid admin password');
            }
        } catch (error) {
            console.error('Admin verification error:', error);
            this.showMessage(error.message || 'Failed to verify admin access', 'error');
            // Reset password field
            const passwordInput = document.getElementById('admin-password');
            if (passwordInput) {
                passwordInput.value = '';
            }
        }
    }

    updateUIForAdmin() {
        // Show admin-only elements
        document.querySelectorAll('.admin-only').forEach(el => {
            el.classList.remove('hidden');
        });

        // Update admin button state
        const adminButton = document.getElementById('admin-button');
        if (adminButton) {
            adminButton.classList.add('active');
            adminButton.innerHTML = '<i class="fas fa-lock-open"></i> Admin Mode';
        }

        // Show admin controls in event details
        document.querySelectorAll('.admin-buttons').forEach(el => {
            el.classList.remove('hidden');
        });
    }

    showAdminModal() {
        const modal = document.getElementById('admin-modal');
        if (modal) {
            modal.classList.remove('hidden');
            // Clear previous password
            const passwordInput = document.getElementById('admin-password');
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.focus();
            }
        }
    }

    hideAdminModal() {
        const modal = document.getElementById('admin-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
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

// Initialize admin manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminManager();
});
