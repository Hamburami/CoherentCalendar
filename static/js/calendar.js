class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.events = [];
        this.isAdmin = false;
        this.editingEventId = null;
        this.activePopup = null;
        this.isAuthenticated = false;
        this.user = null;

        // Add auth-related handlers to existing bound methods
        this.handleAddEventBound = this.handleAddEvent.bind(this);
        this.handleEditEventBound = this.handleEditEvent.bind(this);
        this.handleLoginBound = this.handleLogin.bind(this);
        this.handleRegisterBound = this.handleRegister.bind(this);
        
        this.initializeElements();
        this.setupEventListeners();
        this.checkAuthState();
        this.renderCalendar();
    }

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
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth() + 1;
        try {
            const response = await fetch(`/api/events/${year}/${month}?admin=${this.isAdmin}`);
            this.events = await response.json();
        } catch (error) {
            console.error('Error fetching events:', error);
            this.events = [];
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

    async renderCalendar() {
        await this.fetchEvents();
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        this.currentMonthElement.textContent = `${monthNames[month]} ${year}`;

        this.calendarGrid.innerHTML = '';

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const totalDays = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDay - 1; i >= 0; i--) {
            const dayElement = this.createDayElement(prevMonthLastDay - i, true);
            this.calendarGrid.appendChild(dayElement);
        }

        for (let day = 1; day <= totalDays; day++) {
            const dayElement = this.createDayElement(day, false);
            const dateStr = this.formatDate(year, month + 1, day);
            const dayEvents = this.events.filter(event => event.date === dateStr);
            
            this.renderEvents(dayElement, dayEvents);
            
            this.calendarGrid.appendChild(dayElement);
        }

        const remainingDays = 42 - (startingDay + totalDays);
        for (let day = 1; day <= remainingDays; day++) {
            const dayElement = this.createDayElement(day, true);
            this.calendarGrid.appendChild(dayElement);
        }
    }

    formatDate(year, month, day) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    formatDisplayDate(dateStr) {
        const [year, month, day] = dateStr.split('-');
        return `${parseInt(month)}/${parseInt(day)}/${year}`;
    }

    renderEvents(dayElement, dayEvents) {
        const eventsContainer = dayElement.querySelector('.events-container');
        eventsContainer.innerHTML = '';

        const maxVisibleEvents = 3;
        const visibleEvents = dayEvents.slice(0, maxVisibleEvents);
        const remainingEvents = dayEvents.slice(maxVisibleEvents);

        visibleEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'event';
            if (event.needs_review) {
                eventElement.classList.add('needs-review');
            }
            if (event.isPersonal) {
                eventElement.classList.add('personal-event');
            }
            eventElement.textContent = event.title;
            eventElement.addEventListener('click', () => this.showEventDetails(event));
            if (this.isAdmin) {
                eventElement.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.showEditEventModal(event);
                });
            }
            eventsContainer.appendChild(eventElement);
        });

        if (remainingEvents.length > 0) {
            const moreEventsElement = document.createElement('div');
            moreEventsElement.className = 'more-events';
            moreEventsElement.textContent = `+ ${remainingEvents.length} more`;
            moreEventsElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showEventPopup(dayEvents, moreEventsElement);
            });
            eventsContainer.appendChild(moreEventsElement);
        }
    }

    showAdminModal() {
        if (this.adminModal) {
            this.adminModal.classList.remove('hidden');
            this.overlay.classList.remove('hidden');
            if (document.getElementById('admin-password')) {
                document.getElementById('admin-password').value = '';
            }
        }
    }

    hideAdminModal() {
        if (this.adminModal) {
            this.adminModal.classList.add('hidden');
            this.overlay.classList.add('hidden');
            if (this.adminForm) {
                this.adminForm.reset();
            }
        }
    }

    async handleAdminLogin(e) {
        e.preventDefault();
        const password = document.getElementById('admin-password').value;
        
        if (password === 'future') {
            this.isAdmin = true;
            document.documentElement.setAttribute('data-admin-mode', 'true');
            this.hideAdminModal();
            this.adminAccessBtn.textContent = 'Exit Admin Mode';
            
            // Remove all existing listeners before adding new one
            const newAdminBtn = this.adminAccessBtn.cloneNode(true);
            this.adminAccessBtn.parentNode.replaceChild(newAdminBtn, this.adminAccessBtn);
            this.adminAccessBtn = newAdminBtn;
            this.adminAccessBtn.addEventListener('click', () => this.exitAdminMode());
            
            await this.renderCalendar();  // Refresh calendar to show pending events
        } else {
            alert('Incorrect password');
        }
    }

    async exitAdminMode() {
        this.isAdmin = false;
        document.documentElement.setAttribute('data-admin-mode', 'false');
        this.adminAccessBtn.textContent = 'Admin Access';
        
        // Remove all existing listeners before adding new one
        const newAdminBtn = this.adminAccessBtn.cloneNode(true);
        this.adminAccessBtn.parentNode.replaceChild(newAdminBtn, this.adminAccessBtn);
        this.adminAccessBtn = newAdminBtn;
        this.adminAccessBtn.addEventListener('click', () => this.showAdminModal());
        
        await this.renderCalendar();  // Refresh calendar to hide pending events
    }

    showEventDetails(event) {
        const content = document.getElementById('event-content');
        const tagsContainer = document.getElementById('event-tags');
        const approveButton = this.eventDetails.querySelector('.approve-button');
        const flagButton = this.eventDetails.querySelector('.flag-button');
        const editButton = this.eventDetails.querySelector('.edit-button');
        const deleteButton = this.eventDetails.querySelector('.delete-button');
        
        // Clear previous event listeners
        approveButton.replaceWith(approveButton.cloneNode(true));
        flagButton.replaceWith(flagButton.cloneNode(true));
        editButton.replaceWith(editButton.cloneNode(true));
        deleteButton.replaceWith(deleteButton.cloneNode(true));
        
        // Get fresh references
        const newApproveButton = this.eventDetails.querySelector('.approve-button');
        const newFlagButton = this.eventDetails.querySelector('.flag-button');
        const newEditButton = this.eventDetails.querySelector('.edit-button');
        const newDeleteButton = this.eventDetails.querySelector('.delete-button');

        let detailsHtml = '';
        if (event.needs_review) {
            detailsHtml += '<div class="review-badge">Needs Review</div>';
        }
        
        // Format the date properly
        const [year, month, day] = event.date.split('-');
        const formattedDate = `${month}/${day}/${year}`;
        
        detailsHtml += `
            <h3>${event.title}</h3>
            <p><strong>Date:</strong> ${formattedDate}</p>
            ${event.time ? `<p><strong>Time:</strong> ${event.time}</p>` : ''}
            ${event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : ''}
            ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
            ${event.url ? `<p><strong>URL:</strong> <a href="${event.url}" target="_blank">${event.url}</a></p>` : ''}
        `;
        
        content.innerHTML = detailsHtml;

        // Display tags
        if (event.tags && event.tags.length > 0) {
            const tagsHtml = event.tags.map(tag => `
                <div class="event-tag" style="background-color: ${tag.color || '#808080'}">${tag.name}</div>
            `).join('');
            tagsContainer.innerHTML = tagsHtml;
            tagsContainer.classList.remove('hidden');
        } else {
            tagsContainer.innerHTML = '';
            tagsContainer.classList.add('hidden');
        }
        
        // Show/hide buttons based on admin status and review status
        if (this.isAdmin) {
            newApproveButton.classList.toggle('hidden', !event.needs_review);
            newFlagButton.classList.toggle('hidden', event.needs_review);
            newEditButton.classList.remove('hidden');
            newDeleteButton.classList.remove('hidden');
            
            // Add event listeners for admin actions
            newApproveButton.addEventListener('click', () => this.approveEvent(event.id));
            newFlagButton.addEventListener('click', () => this.flagEvent(event.id));
            newEditButton.addEventListener('click', () => this.showEditEventModal(event));
            newDeleteButton.addEventListener('click', () => this.deleteEvent(event.id));
        } else {
            newApproveButton.classList.add('hidden');
            newFlagButton.classList.add('hidden');
            newEditButton.classList.add('hidden');
            newDeleteButton.classList.add('hidden');
        }
        
        if (this.eventDetails) {
            this.eventDetails.classList.remove('hidden');
        }
        if (this.overlay) {
            this.overlay.classList.remove('hidden');
        }
    }

    async deleteEvent(eventId) {
        if (!this.isAdmin) return;

        try {
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.hideEventDetails();
            await this.renderCalendar();
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Failed to delete event. Please try again.');
        }
    }

    hideEventDetails() {
        if (this.eventDetails) {
            this.eventDetails.classList.add('hidden');
            this.overlay.classList.add('hidden');
        }
    }

    showAddEventModal() {
        this.editingEventId = null;
        this.addEventForm.reset();
        this.submitButton.textContent = 'Add Event';
        if (this.addEventModal) {
            this.addEventModal.classList.remove('hidden');
        }
        if (this.overlay) {
            this.overlay.classList.remove('hidden');
        }
        
        // Ensure correct event handler
        this.addEventForm.removeEventListener('submit', this.handleEditEventBound);
        this.addEventForm.addEventListener('submit', this.handleAddEventBound);
    }

    hideAddEventModal() {
        if (this.addEventModal) {
            this.addEventModal.classList.add('hidden');
            this.overlay.classList.add('hidden');
            this.addEventForm.reset();
            this.editingEventId = null;
        }
    }

    hideAllModals() {
        const modals = [
            this.eventDetails,
            this.addEventModal,
            this.adminModal,
            this.scraperModal,
            this.loginModal,
            this.registerModal,
            this.profileModal
        ];

        modals.forEach(modal => {
            if (modal) {
                modal.classList.add('hidden');
            }
        });

        if (this.overlay) {
            this.overlay.classList.add('hidden');
        }
    }

    async handleAddEvent(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('event-title').value.trim(),
            date: document.getElementById('event-date').value,
            time: document.getElementById('event-time').value || null,
            location: document.getElementById('event-location').value.trim() || null,
            description: document.getElementById('event-description').value.trim() || null,
            url: document.getElementById('event-url').value.trim() || null
        };

        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            // Reset form and hide modal
            this.addEventForm.reset();
            this.hideAddEventModal();
            
            // Refresh calendar to show new event
            await this.renderCalendar();
        } catch (error) {
            console.error('Error adding event:', error);
            alert(`Failed to add event: ${error.message}`);
        }
    }

    showEditEventModal(event) {
        this.editingEventId = event.id;
        if (this.addEventModal) {
            this.addEventModal.classList.remove('hidden');
        }
        if (this.overlay) {
            this.overlay.classList.remove('hidden');
        }
        
        // Populate form with event data
        document.getElementById('event-title').value = event.title;
        document.getElementById('event-date').value = event.date;
        document.getElementById('event-time').value = event.time || '';
        document.getElementById('event-location').value = event.location || '';
        document.getElementById('event-description').value = event.description || '';
        document.getElementById('event-url').value = event.url || '';
        
        this.submitButton.textContent = 'Update Event';
        
        // Switch event handlers
        this.addEventForm.removeEventListener('submit', this.handleAddEventBound);
        this.addEventForm.addEventListener('submit', this.handleEditEventBound);
    }

    async handleEditEvent(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('event-title').value,
            date: document.getElementById('event-date').value,
            time: document.getElementById('event-time').value,
            location: document.getElementById('event-location').value,
            description: document.getElementById('event-description').value,
            url: document.getElementById('event-url').value
        };
        
        try {
            const response = await fetch(`/api/events/${this.editingEventId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                await this.renderCalendar();
                this.hideAddEventModal();
                this.hideEventDetails();
            } else {
                const error = await response.json();
                alert(error.error || 'Error updating event');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error updating event');
        }
        
        // Reset event handlers
        this.addEventForm.removeEventListener('submit', this.handleEditEventBound);
        this.addEventForm.addEventListener('submit', this.handleAddEventBound);
        this.submitButton.textContent = 'Add Event';
    }

    hideEventPopup() {
        if (this.activePopup) {
            this.activePopup.remove();
            this.activePopup = null;
        }
    }

    showEventPopup(events, anchorElement) {
        if (this.activePopup) {
            this.hideEventPopup();
        }

        const popup = document.createElement('div');
        popup.className = 'event-popup';
        
        const popupContent = events.map(event => {
            const needsReviewBadge = event.needs_review ? '<span class="review-badge-small">Review</span>' : '';
            
            // Create tags HTML if event has tags
            const tagsHtml = event.tags && event.tags.length > 0 
                ? `<div class="event-tags">
                    ${event.tags.map(tag => `
                        <div class="event-tag" style="background-color: ${tag.color || '#808080'}">${tag.name}</div>
                    `).join('')}
                   </div>`
                : '';
            
            return `
                <div class="popup-event" data-event-id="${event.id}">
                    <div class="popup-event-header">
                        ${needsReviewBadge}
                        <strong>${event.title}</strong>
                    </div>
                    ${event.time ? `<div class="popup-event-time">${event.time}</div>` : ''}
                    ${event.location ? `<div class="popup-event-location">${event.location}</div>` : ''}
                    ${tagsHtml}
                </div>
            `;
        }).join('');

        popup.innerHTML = popupContent;
        
        // Position popup
        const rect = anchorElement.getBoundingClientRect();
        popup.style.position = 'absolute';
        popup.style.left = `${rect.left + window.scrollX}px`;
        popup.style.top = `${rect.bottom + window.scrollY}px`;
        
        // Add click handlers
        popup.addEventListener('click', (e) => {
            const eventElement = e.target.closest('.popup-event');
            if (eventElement) {
                const eventId = eventElement.dataset.eventId;
                const event = events.find(ev => ev.id === parseInt(eventId));
                if (event) {
                    this.showEventDetails(event);
                }
            }
        });
        
        document.body.appendChild(popup);
        this.activePopup = popup;
        
        // Hide popup when clicking outside
        document.addEventListener('click', (e) => {
            if (this.activePopup && !this.activePopup.contains(e.target) && !anchorElement.contains(e.target)) {
                this.hideEventPopup();
            }
        });
    }

    async approveEvent(eventId) {
        try {
            const response = await fetch(`/api/events/${eventId}/approve`, {
                method: 'POST'
            });
            
            if (response.ok) {
                await this.renderCalendar();
                this.hideEventDetails();
            } else {
                console.error('Error approving event');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async flagEvent(eventId) {
        try {
            const response = await fetch(`/api/events/${eventId}/flag`, {
                method: 'POST'
            });
            
            if (response.ok) {
                await this.renderCalendar();
                this.hideEventDetails();
            } else {
                console.error('Error flagging event');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

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
        }
    }

    // Modal Management
    showLoginModal() {
        if (this.loginModal) {
            this.loginModal.classList.remove('hidden');
        }
    }

    hideLoginModal() {
        if (this.loginModal) {
            this.loginModal.classList.add('hidden');
            this.loginForm.reset();
        }
    }

    showRegisterModal() {
        if (this.registerModal) {
            this.registerModal.classList.remove('hidden');
        }
    }

    hideRegisterModal() {
        if (this.registerModal) {
            this.registerModal.classList.add('hidden');
            this.registerForm.reset();
        }
    }

    showProfileModal() {
        if (this.profileModal) {
            this.profileModal.classList.remove('hidden');
        }
    }

    hideProfileModal() {
        if (this.profileModal) {
            this.profileModal.classList.add('hidden');
        }
    }

    hideAllModals() {
        const modals = [
            this.eventDetails,
            this.addEventModal,
            this.adminModal,
            this.scraperModal,
            this.loginModal,
            this.registerModal,
            this.profileModal
        ];

        modals.forEach(modal => {
            if (modal) {
                modal.classList.add('hidden');
            }
        });

        if (this.overlay) {
            this.overlay.classList.add('hidden');
        }
    }

    // Authentication Handlers
    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store token and update global state
                const token = data.token;
                localStorage.setItem('token', token);
                window.authToken = token;
                window.isAuthenticated = true;
                
                // Update instance state
                this.user = data.user;
                this.isAuthenticated = true;
                
                // Update UI
                this.updateAuthState();
                this.hideLoginModal();
                this.showMessage('Successfully logged in!');
                
                // Refresh calendar to show personalized content
                this.renderCalendar();
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
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
        this.updateAuthState();
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
        this.updateAuthState();
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
            this.updateAuthState();
            
        } catch (error) {
            console.error('Profile load error:', error);
            this.handleLogout();
        }
    }

    updateAuthState() {
        document.body.classList.toggle('authenticated', this.isAuthenticated);
        
        // Update button visibility
        if (this.loginBtn) {
            this.loginBtn.classList.toggle('hidden', this.isAuthenticated);
        }
        if (this.registerBtn) {
            this.registerBtn.classList.toggle('hidden', this.isAuthenticated);
        }
        if (this.profileBtn) {
            this.profileBtn.classList.toggle('hidden', !this.isAuthenticated);
        }
        
        // Update other auth-dependent elements
        document.querySelectorAll('.auth-required').forEach(el => {
            el.style.display = this.isAuthenticated ? 'block' : 'none';
        });
        
        document.querySelectorAll('.auth-hide').forEach(el => {
            el.style.display = this.isAuthenticated ? 'none' : 'block';
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

    showMessage(message, type = 'success') {
        // Implement message display logic
        console.log(`${type}: ${message}`);
        // You could add a toast or notification system here
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
}

document.addEventListener('DOMContentLoaded', () => {
    const calendar = new Calendar();
    window.calendar = calendar;
});
