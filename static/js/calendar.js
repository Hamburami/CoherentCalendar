document.addEventListener('DOMContentLoaded', () => {
    const calendar = new Calendar();
    window.calendar = calendar;  // Make calendar accessible globally
});

class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.isAdmin = false;
        this.events = [];
        
        // Initialize elements
        this.currentMonthElement = document.getElementById('currentMonth');
        this.calendarBody = document.querySelector('.calendar-body');
        this.prevButton = document.getElementById('prevMonth');
        this.nextButton = document.getElementById('nextMonth');
        
        if (this.prevButton) {
            this.prevButton.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.renderCalendar(this.isAdmin);
            });
        }

        if (this.nextButton) {
            this.nextButton.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.renderCalendar(this.isAdmin);
            });
        }

        this.renderCalendar();
    }

<<<<<<< Updated upstream
    initializeElements() {
        this.calendarGrid = document.getElementById('calendar-grid');
        this.currentMonthElement = document.getElementById('currentMonth');
        this.prevMonthButton = document.getElementById('prevMonth');
        this.nextMonthButton = document.getElementById('nextMonth');
        this.eventDetails = document.getElementById('event-details');
        this.eventContent = document.getElementById('event-content');
        this.eventTags = document.getElementById('event-tags');
        this.overlay = document.getElementById('overlay');
        this.closeButton = document.getElementById('close-button');
        this.addEventBtn = document.getElementById('addEventBtn');
        this.addEventModal = document.getElementById('add-event-modal');
        this.closeModalButton = document.getElementById('close-modal-button');
        this.addEventForm = document.getElementById('add-event-form');
        this.submitButton = this.addEventForm.querySelector('.submit-btn');
        this.adminAccessBtn = document.getElementById('adminAccessBtn');
        this.adminModal = document.getElementById('admin-modal');
        this.closeAdminModal = document.getElementById('close-admin-modal');
        this.adminForm = document.getElementById('admin-form');
        this.scrapeTridentBtn = document.getElementById('scrapeTridentBtn');
        this.scraperBtn = document.getElementById('scraperBtn');
        this.scraperModal = document.getElementById('scraper-modal');
        this.closeScraperModal = document.getElementById('close-scraper-modal');
        this.scraperUrl = document.getElementById('scraper-url');
        this.scrapeButton = document.getElementById('scrape-button');
        this.interpretButton = document.getElementById('interpret-button');
        this.toSqlButton = document.getElementById('tosql-button');
        this.executeSqlButton = document.getElementById('execute-sql-button');
        this.scrapeOutput = document.getElementById('scrape-output');
        this.interpretOutput = document.getElementById('interpret-output');
        this.sqlOutput = document.getElementById('sql-output');

        // Auth-related elements
        this.loginBtn = document.getElementById('loginBtn');
        this.registerBtn = document.getElementById('registerBtn');
        this.loginModal = document.getElementById('login-modal');
        this.registerModal = document.getElementById('register-modal');
        this.profileModal = document.getElementById('profile-modal');
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.logoutBtn = document.getElementById('logout-btn');
        this.overlay = document.getElementById('overlay');
        
        // Close buttons
        this.closeLoginModal = document.getElementById('close-login-modal');
        this.closeRegisterModal = document.getElementById('close-register-modal');
        this.closeProfileModal = document.getElementById('close-profile-modal');
        
        // Switch links
        this.switchToRegister = document.getElementById('switch-to-register');
        this.switchToLogin = document.getElementById('switch-to-login');
    }

    setupEventListeners() {
        // Calendar navigation
        if (this.prevMonthButton) {
            this.prevMonthButton.addEventListener('click', () => this.changeMonth(-1));
        }
        if (this.nextMonthButton) {
            this.nextMonthButton.addEventListener('click', () => this.changeMonth(1));
        }
        
        // Event details
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.hideEventDetails());
        }
        
        // Add event modal
        if (this.addEventBtn) {
            this.addEventBtn.addEventListener('click', () => this.showAddEventModal());
        }
        if (this.closeModalButton) {
            this.closeModalButton.addEventListener('click', () => this.hideAddEventModal());
        }
        if (this.addEventForm) {
            this.addEventForm.addEventListener('submit', this.handleAddEventBound);
        }
        
        // Admin modal
        if (this.adminAccessBtn) {
            this.adminAccessBtn.addEventListener('click', () => {
                if (this.isAdmin) {
                    this.exitAdminMode();
                } else {
                    this.showAdminModal();
                }
            });
        }
        if (this.closeAdminModal) {
            this.closeAdminModal.addEventListener('click', () => this.hideAdminModal());
        }
        if (this.adminForm) {
            this.adminForm.addEventListener('submit', (e) => this.handleAdminLogin(e));
        }
        
        // Scraper modal
        if (this.scraperBtn) {
            this.scraperBtn.addEventListener('click', () => this.showScraperModal());
        }
        if (this.closeScraperModal) {
            this.closeScraperModal.addEventListener('click', () => this.hideScraperModal());
        }
        
        // Auth modals
        if (this.loginBtn) {
            this.loginBtn.addEventListener('click', () => this.showLoginModal());
        }
        if (this.registerBtn) {
            this.registerBtn.addEventListener('click', () => this.showRegisterModal());
        }
        
        // Close buttons for auth modals
        if (this.closeLoginModal) {
            this.closeLoginModal.addEventListener('click', () => this.hideLoginModal());
        }
        if (this.closeRegisterModal) {
            this.closeRegisterModal.addEventListener('click', () => this.hideRegisterModal());
        }
        if (this.closeProfileModal) {
            this.closeProfileModal.addEventListener('click', () => this.hideProfileModal());
        }
        
        // Switch between login and register
        if (this.switchToRegister) {
            this.switchToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideLoginModal();
                this.showRegisterModal();
            });
        }
        
        if (this.switchToLogin) {
            this.switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideRegisterModal();
                this.showLoginModal();
            });
        }
        
        // Form submissions
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', this.handleLoginBound);
        }
        if (this.registerForm) {
            this.registerForm.addEventListener('submit', this.handleRegisterBound);
        }
        
        // Hide modals when clicking overlay
        if (this.overlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.hideAllModals();
                }
            });
        }
    }

    async fetchEvents() {
=======
    async renderCalendar(adminMode = false) {
        if (!this.calendarBody || !this.currentMonthElement) return;

        this.isAdmin = adminMode;
>>>>>>> Stashed changes
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Update month display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        this.currentMonthElement.textContent = `${monthNames[month]} ${year}`;

        // Clear existing calendar
        this.calendarBody.innerHTML = '';

        // Get first day and last day of month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        let currentRow = document.createElement('tr');
        
        // Add empty cells for days before first of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            const cell = document.createElement('td');
            cell.classList.add('empty');
            currentRow.appendChild(cell);
        }

        // Add days of month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            if (currentRow.children.length === 7) {
                this.calendarBody.appendChild(currentRow);
                currentRow = document.createElement('tr');
            }

            const cell = document.createElement('td');
            const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            cell.dataset.date = date;

            // Add day number
            const dayNumber = document.createElement('div');
            dayNumber.classList.add('day-number');
            dayNumber.textContent = day;
            cell.appendChild(dayNumber);

            currentRow.appendChild(cell);
        }

        // Add empty cells for remaining days
        while (currentRow.children.length < 7) {
            const cell = document.createElement('td');
            cell.classList.add('empty');
            currentRow.appendChild(cell);
        }

        this.calendarBody.appendChild(currentRow);
    }
    
    initializeUI() {
        // Initialize admin button
        const adminButton = document.getElementById('admin-button');
        if (adminButton) {
            adminButton.addEventListener('click', () => {
                const modal = document.getElementById('admin-modal');
                if (modal) modal.classList.add('visible');
            });
        }
        
        // Initialize admin form
        const adminForm = document.getElementById('admin-form');
        if (adminForm) {
            adminForm.addEventListener('submit', (e) => this.handleAdminAccess(e));
        }
        
        // Initialize close buttons
        document.querySelectorAll('.close-button').forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                if (modal) modal.classList.remove('visible');
            });
        });
        
        // Initialize preferences button
        const preferencesButton = document.getElementById('preferences-button');
        if (preferencesButton) {
            preferencesButton.addEventListener('click', () => {
                const modal = document.getElementById('preferences-container');
                if (modal) {
                    modal.classList.toggle('visible');
                    if (modal.classList.contains('visible')) {
                        this.loadUserPreferences();
                    }
                }
            });
        }
        
        // Initialize add event button
        const addEventButton = document.getElementById('add-event-button');
        if (addEventButton) {
            addEventButton.addEventListener('click', () => {
                const modal = document.getElementById('add-event-modal');
                if (modal) {
                    modal.classList.add('visible');
                    const dateInput = modal.querySelector('#event-date');
                    if (dateInput) {
                        dateInput.valueAsDate = new Date();
                    }
                }
            });
        }
        
        // Initialize event form
        const eventForm = document.getElementById('add-event-form');
        if (eventForm) {
            eventForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(eventForm);
                const data = {
                    title: formData.get('title'),
                    date: formData.get('date'),
                    description: formData.get('description'),
                    location: formData.get('location')
                };
                
                try {
                    const response = await fetch('/api/events', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                    
                    if (response.ok) {
                        this.showMessage('Event added successfully!');
                        const modal = document.getElementById('add-event-modal');
                        if (modal) modal.classList.remove('visible');
                        await this.renderCalendar();
                    } else {
                        const error = await response.json();
                        this.showMessage(error.message || 'Failed to add event', 'error');
                    }
                } catch (error) {
                    console.error('Error adding event:', error);
                    this.showMessage('Failed to add event', 'error');
                }
            });
        }
    }
    
    async fetchEvents(year, month, adminMode = false) {
        try {
            const response = await fetch(`/api/events/${year}/${month}${adminMode ? '?admin=true' : ''}`);
            if (!response.ok) throw new Error('Failed to fetch events');
            
            this.events = await response.json();
        } catch (error) {
            console.error('Error fetching events:', error);
            this.showMessage('Failed to fetch events', 'error');
        }
    }

    createDayElement(day, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = `calendar-day${isOtherMonth ? ' other-month' : ''}`;
        
        const dateElement = document.createElement('span');
        dateElement.className = 'date';
        dateElement.textContent = day;
        dayElement.appendChild(dateElement);

        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'events-container';
        dayElement.appendChild(eventsContainer);
        
        return dayElement;
    }

    async showEventDetails(event) {
        if (!this.eventDetailsModal) return;
        
        const content = document.getElementById('event-content');
        const tags = document.getElementById('event-tags');
        const adminButtons = this.eventDetailsModal.querySelector('.admin-buttons');
        
        if (content) {
            content.innerHTML = `
                <h3>${event.title}</h3>
                <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
                ${event.time ? `<p><strong>Time:</strong> ${event.time}</p>` : ''}
                <p><strong>Description:</strong> ${event.description || 'No description'}</p>
            `;
        }

        if (tags && event.tags) {
            tags.innerHTML = event.tags.map(tag => 
                `<span class="tag">${tag}</span>`
            ).join('');
        }

        // Show/hide admin buttons based on admin status and event state
        if (adminButtons) {
            if (this.isAdmin) {
                adminButtons.classList.remove('hidden');
                const approveButton = adminButtons.querySelector('.approve-button');
                const flagButton = adminButtons.querySelector('.flag-button');
                
                if (approveButton) {
                    if (event.pending) {
                        approveButton.classList.remove('hidden');
                        approveButton.onclick = () => this.approveEvent(event.id);
                    } else {
                        approveButton.classList.add('hidden');
                    }
                }
                
                if (flagButton) {
                    flagButton.classList.remove('hidden');
                    flagButton.onclick = () => this.flagEvent(event.id);
                }
            } else {
                adminButtons.classList.add('hidden');
            }
        }

        this.eventDetailsModal.classList.remove('hidden');
    }

    async approveEvent(eventId) {
        try {
            const response = await fetch(`/api/events/${eventId}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to approve event');

            this.showMessage('Event approved successfully');
            this.eventDetailsModal.classList.add('hidden');
            await this.renderCalendar(true);

        } catch (error) {
            console.error('Error approving event:', error);
            this.showMessage('Failed to approve event', 'error');
        }
    }

    async flagEvent(eventId) {
        try {
            const response = await fetch(`/api/events/${eventId}/flag`, {
<<<<<<< Updated upstream
                method: 'POST'
            });
            
            if (response.ok) {
                await this.renderCalendar();
                this.hideEventDetails();
            } else {
                console.error('Error flagging event');
=======
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to flag event');

            this.showMessage('Event flagged for review');
            this.eventDetailsModal.classList.add('hidden');
            await this.renderCalendar(true);

        } catch (error) {
            console.error('Error flagging event:', error);
            this.showMessage('Failed to flag event', 'error');
        }
    }

    showScraperModal() {
        const modal = document.getElementById('scraper-modal');
        if (modal) {
            modal.classList.add('visible');
        }
    }

    hideScraperModal() {
        const modal = document.getElementById('scraper-modal');
        if (modal) {
            modal.classList.remove('visible');
        }
    }

    async handleScrapeUrl() {
        const url = document.getElementById('scraper-url').value;
        const status = document.getElementById('scraper-status');
        const progress = status.querySelector('.progress');
        const statusText = status.querySelector('.status-text');
        
        try {
            // Show status
            status.classList.add('active');
            progress.style.width = '0%';
            statusText.textContent = 'Scraping URL...';
            
            // Step 1: Scrape URL
            progress.style.width = '20%';
            const response = await fetch('/api/scraper/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });
            
            if (!response.ok) {
                throw new Error('Failed to scrape URL');
            }
            
            const rawContent = await response.text();
            document.getElementById('scrape-output').value = rawContent;
            
            // Step 2: AI Interpretation
            progress.style.width = '40%';
            statusText.textContent = 'Interpreting content...';
            
            const interpretResponse = await fetch('/api/scraper/interpret', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: rawContent })
            });
            
            if (!interpretResponse.ok) {
                throw new Error('Failed to interpret content');
            }
            
            const interpretedContent = await interpretResponse.json();
            document.getElementById('interpret-output').value = JSON.stringify(interpretedContent, null, 2);
            
            // Step 3: Generate SQL
            progress.style.width = '60%';
            statusText.textContent = 'Generating SQL...';
            
            const sqlResponse = await fetch('/api/scraper/tosql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(interpretedContent)
            });
            
            if (!sqlResponse.ok) {
                throw new Error('Failed to generate SQL');
            }
            
            const sqlContent = await sqlResponse.text();
            document.getElementById('sql-output').value = sqlContent;
            
            // Complete
            progress.style.width = '100%';
            statusText.textContent = 'Scraping completed successfully!';
            
            // Enable buttons
            document.getElementById('interpret-button').disabled = false;
            document.getElementById('tosql-button').disabled = false;
            document.getElementById('execute-sql-button').disabled = false;
            
        } catch (error) {
            console.error('Scraping error:', error);
            statusText.textContent = `Error: ${error.message}`;
            progress.style.width = '100%';
            progress.style.backgroundColor = '#dc3545';
        }
    }

    async interpretEvents() {
        try {
            const scrapeOutput = document.getElementById('scrape-output');
            const interpretOutput = document.getElementById('interpret-output');
            
            if (!scrapeOutput || !scrapeOutput.value) {
                console.error('No content to interpret');
                return;
            }
            
            console.log('Sending text for interpretation:', scrapeOutput.value);
            
            const response = await fetch('/api/scrape/interpret', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: scrapeOutput.value
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Interpretation result:', result);
                
                if (result.error) {
                    console.error('Error from server:', result.error);
                    return;
                }
                
                if (interpretOutput) {
                    interpretOutput.value = JSON.stringify(result.events || [], null, 2);
                }
            } else {
                console.error('Error interpreting events:', response.statusText);
>>>>>>> Stashed changes
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

<<<<<<< Updated upstream
    async scrapeTrident() {
        try {
            this.scrapeTridentBtn.disabled = true;
            this.scrapeTridentBtn.textContent = 'Scraping...';
            
            const response = await fetch('/api/scrape', { method: 'POST' });
            const data = await response.json();
            
            if (response.ok) {
                this.scrapeTridentBtn.textContent = `✓ Scraped ${data.event_count} events`;
                setTimeout(() => {
                    this.scrapeTridentBtn.textContent = 'Scrape Trident';
                }, 3000);
                await this.renderCalendar();  // Refresh the calendar
            } else {
                this.scrapeTridentBtn.textContent = '✗ Error scraping';
                setTimeout(() => {
                    this.scrapeTridentBtn.textContent = 'Scrape Trident';
                }, 3000);
            }
        } catch (error) {
            console.error('Scraping error:', error);
            this.scrapeTridentBtn.textContent = '✗ Error scraping';
            setTimeout(() => {
                this.scrapeTridentBtn.textContent = 'Scrape Trident';
            }, 3000);
        } finally {
            this.scrapeTridentBtn.disabled = false;
        }
    }

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
    }

    showScraperModal() {
        if (this.scraperModal) {
            this.scraperModal.classList.remove('hidden');
        }
        if (this.overlay) {
            this.overlay.classList.remove('hidden');
        }
    }

    hideScraperModal() {
        if (this.scraperModal) {
            this.scraperModal.classList.add('hidden');
        }
        if (this.overlay) {
            this.overlay.classList.add('hidden');
=======
    async convertToSql() {
        try {
            const interpretOutput = document.getElementById('interpret-output');
            const sqlOutput = document.getElementById('sql-output');
            
            if (!interpretOutput || !interpretOutput.value) {
                console.error('No events to convert to SQL');
                return;
            }
            
            const response = await fetch('/api/scrape/eventsql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    events: JSON.parse(interpretOutput.value)
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (sqlOutput) {
                    sqlOutput.value = result.sql || '';
                }
                console.log('SQL conversion successful:', result);
            } else {
                console.error('Error converting to SQL');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async executeSql() {
        try {
            const sqlOutput = document.getElementById('sql-output');
            
            if (!sqlOutput || !sqlOutput.value) {
                console.error('No SQL to execute');
                return;
            }
            
            const response = await fetch('/api/scrape/executesql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sql: sqlOutput.value
                })
            });
            
            if (response.ok) {
                console.log('SQL execution successful');
                await this.renderCalendar();  // Refresh calendar to show new events
            } else {
                console.error('Error executing SQL');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    setupScraperEventListeners() {
        const scrapeButton = document.getElementById('scrape-button');
        const interpretButton = document.getElementById('interpret-button');
        const tosqlButton = document.getElementById('tosql-button');
        const executeSqlButton = document.getElementById('execute-sql-button');
        
        if (scrapeButton) {
            scrapeButton.addEventListener('click', () => this.handleScrapeUrl());
        }
        
        if (interpretButton) {
            interpretButton.addEventListener('click', async () => {
                const rawContent = document.getElementById('scrape-output').value;
                if (!rawContent) return;
                
                try {
                    const response = await fetch('/api/scraper/interpret', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ content: rawContent })
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to interpret content');
                    }
                    
                    const interpretedContent = await response.json();
                    document.getElementById('interpret-output').value = JSON.stringify(interpretedContent, null, 2);
                    
                } catch (error) {
                    console.error('Interpretation error:', error);
                    this.showMessage('Failed to interpret content', 'error');
                }
            });
        }
        
        if (tosqlButton) {
            tosqlButton.addEventListener('click', async () => {
                const interpretedContent = document.getElementById('interpret-output').value;
                if (!interpretedContent) return;
                
                try {
                    const response = await fetch('/api/scraper/tosql', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: interpretedContent
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to generate SQL');
                    }
                    
                    const sqlContent = await response.text();
                    document.getElementById('sql-output').value = sqlContent;
                    
                } catch (error) {
                    console.error('SQL generation error:', error);
                    this.showMessage('Failed to generate SQL', 'error');
                }
            });
        }
        
        if (executeSqlButton) {
            executeSqlButton.addEventListener('click', async () => {
                const sqlContent = document.getElementById('sql-output').value;
                if (!sqlContent) return;
                
                try {
                    const response = await fetch('/api/scrape/execute', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ sql: sqlContent })
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to execute SQL');
                    }
                    
                    this.showMessage('Events imported successfully!');
                    await this.renderCalendar();
                    
                } catch (error) {
                    console.error('SQL execution error:', error);
                    this.showMessage('Failed to import events', 'error');
                }
            });
>>>>>>> Stashed changes
        }
    }

    // Modal Management
    showLoginModal() {
        if (this.loginModal) {
            this.loginModal.classList.add('visible');
        }
    }

    hideLoginModal() {
        if (this.loginModal) {
            this.loginModal.classList.remove('visible');
        }
    }

    showRegisterModal() {
        if (this.registerModal) {
            this.registerModal.classList.add('visible');
        }
    }

    hideRegisterModal() {
        if (this.registerModal) {
            this.registerModal.classList.remove('visible');
        }
    }

    showProfileModal() {
        if (this.profileModal) {
            this.profileModal.classList.add('visible');
        }
    }

    hideProfileModal() {
        if (this.profileModal) {
            this.profileModal.classList.remove('visible');
        }
    }

    hideAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('visible');
        });
    }

    // Authentication Handlers
    async login(email, password) {
        try {
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                return true;
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            this.showMessage('Please enter both email and password', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Store auth data
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                
                // Update UI
                this.isAuthenticated = true;
                this.user = result.user;
                this.updateAuthUI();
                
                // Load user preferences
                await this.loadUserPreferences();
                
                // Hide login modal
                this.hideLoginModal();
                
                // Refresh calendar
                await this.renderCalendar();
                
                // Show success message
                this.showMessage('Successfully logged in!');
            } else {
                this.showMessage(result.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('An error occurred during login', 'error');
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        const email = document.getElementById('register-email').value;
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        try {
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Show success message
                this.showMessage('Registration successful! Please log in.');
                
                // Clear the registration form
                this.registerForm.reset();
                
                // Wait for 1.5 seconds before switching to login
                setTimeout(() => {
                    this.hideRegisterModal();
                    this.showLoginModal();
                }, 1500);
            } else {
                throw new Error(data.error || 'Registration failed');
            }
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    handleLogout() {
        localStorage.removeItem('token');
        window.authToken = null;
        window.isAuthenticated = false;
        this.isAuthenticated = false;
        this.user = null;
        this.updateAuthUI();
        this.renderCalendar();
        this.showMessage('Successfully logged out!');
    }

    // Auth State Management
    checkAuthState() {
        const token = localStorage.getItem('token');
        if (token) {
            window.authToken = token;
            window.isAuthenticated = true;
            this.isAuthenticated = true;
            this.loadUserProfile();
        } else {
            window.authToken = null;
            window.isAuthenticated = false;
            this.isAuthenticated = false;
            this.user = null;
        }
        this.updateAuthUI();
    }

    async loadUserProfile() {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
            const response = await fetch('/api/users/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load profile');
            }
            
            const data = await response.json();
            this.user = data.user;
            this.isAuthenticated = true;
            this.updateAuthUI();
            
        } catch (error) {
            console.error('Profile load error:', error);
            this.handleLogout();
        }
    }

    updateAuthUI() {
        document.body.classList.toggle('authenticated', this.isAuthenticated);
        
        // Update button visibility
        if (this.loginButton) {
            this.loginButton.classList.toggle('hidden', this.isAuthenticated);
        }
        if (this.registerButton) {
            this.registerButton.classList.toggle('hidden', this.isAuthenticated);
        }
        if (this.profileButton) {
            this.profileButton.classList.toggle('hidden', !this.isAuthenticated);
        }
        if (this.preferencesButton) {
            this.preferencesButton.classList.toggle('hidden', !this.isAuthenticated);
        }
        
        // Update other auth-dependent elements
        const authHideElements = document.querySelectorAll('.auth-hide');
        authHideElements.forEach(element => {
            element.classList.toggle('hidden', this.isAuthenticated);
        });
        
        const authRequiredElements = document.querySelectorAll('.auth-required');
        authRequiredElements.forEach(element => {
            element.classList.toggle('hidden', !this.isAuthenticated);
        });
    }

    updateProfileUI() {
        if (!this.user) return;
        
        // Update profile information
        if (document.getElementById('profile-username')) {
            document.getElementById('profile-username').textContent = this.user.username;
        }
        if (document.getElementById('profile-email')) {
            document.getElementById('profile-email').textContent = this.user.email;
        }
        
        // Update preferences and stats if available
        if (this.user.preferences) {
            const preferencesContainer = document.getElementById('tag-preferences');
            preferencesContainer.innerHTML = this.user.preferences
                .map(pref => `
                    <div class="tag-preference">
                        <span class="tag-name">${pref.name}</span>
                        <span class="weight">${(pref.weight * 100).toFixed(0)}%</span>
                    </div>
                `).join('');
        }
        
        if (this.user.interactions) {
            const statsContainer = document.getElementById('user-stats');
            statsContainer.innerHTML = `
                <div class="stat-box">
                    <div class="number">${this.user.interactions.like || 0}</div>
                    <div class="label">Liked Events</div>
                </div>
                <div class="stat-box">
                    <div class="number">${this.user.interactions.maybe || 0}</div>
                    <div class="label">Maybe</div>
                </div>
                <div class="stat-box">
                    <div class="number">${this.user.interactions.dislike || 0}</div>
                    <div class="label">Passed</div>
                </div>
            `;
        }
    }

    async loadUserPreferences() {
        try {
            const response = await fetch('/api/preferences');
            if (response.ok) {
                const preferences = await response.json();
                this.userPreferences = preferences;
                
                // Update UI with preferences
                const colorPicker = document.getElementById('event-color');
                if (colorPicker) {
                    colorPicker.value = preferences.eventColor || '#4CAF50';
                }
                
                const reminderSelect = document.getElementById('reminder-time');
                if (reminderSelect) {
                    reminderSelect.value = preferences.reminderTime || '30';
                }
                
                const viewSelect = document.getElementById('calendar-view');
                if (viewSelect) {
                    viewSelect.value = preferences.defaultView || 'month';
                }
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
            this.showMessage('Failed to load preferences', 'error');
        }
    }

    togglePreferences() {
        if (this.preferencesContainer) {
            const isHidden = !this.preferencesContainer.classList.contains('visible');
            if (isHidden) {
                // Hide any other visible modals first
                const modals = document.querySelectorAll('.modal.visible');
                modals.forEach(modal => modal.classList.remove('visible'));
                
                // Show preferences
                this.preferencesContainer.classList.add('visible');
                this.loadUserPreferences();
            } else {
                this.preferencesContainer.classList.remove('visible');
            }
        }
    }

    async handleExecuteSql() {
        const sql = this.sqlOutput.value.trim();
        if (!sql) {
            alert('No SQL to execute');
            return;
        }

        try {
            const response = await fetch('/executesql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sql }),
            });
            const data = await response.json();
            if (data.success) {
                alert('SQL executed successfully');
                this.hideScraperModal();
                this.renderCalendar(); // Refresh the calendar to show new events
            } else {
                alert('Failed to execute SQL: ' + data.error);
            }
        } catch (error) {
            console.error('SQL execution failed:', error);
            alert('Failed to execute SQL');
        }
    }
<<<<<<< Updated upstream
}

document.addEventListener('DOMContentLoaded', () => {
    const calendar = new Calendar();
    window.calendar = calendar;
});
=======

    previousMonth() {
        if (this.currentMonth === 1) {
            this.currentMonth = 12;
            this.currentYear--;
        } else {
            this.currentMonth--;
        }
        this.renderCalendar();
    }

    nextMonth() {
        if (this.currentMonth === 12) {
            this.currentMonth = 1;
            this.currentYear++;
        } else {
            this.currentMonth++;
        }
        this.renderCalendar();
    }

    updateCurrentMonthDisplay() {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthElement = document.getElementById('currentMonth');
        if (monthElement) {
            monthElement.textContent = `${months[this.currentMonth - 1]} ${this.currentYear}`;
        }
    }

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
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
>>>>>>> Stashed changes
