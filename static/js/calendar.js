class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.events = [];
        this.isAdmin = false;
        this.editingEventId = null;
        this.activePopup = null;
        this.handleAddEventBound = this.handleAddEvent.bind(this);
        this.handleEditEventBound = this.handleEditEvent.bind(this);
        this.initializeElements();
        this.setupEventListeners();
        this.renderCalendar();
    }

    initializeElements() {
        this.calendarGrid = document.getElementById('calendar-grid');
        this.currentMonthElement = document.getElementById('currentMonth');
        this.prevMonthButton = document.getElementById('prevMonth');
        this.nextMonthButton = document.getElementById('nextMonth');
        this.eventDetails = document.getElementById('event-details');
        this.eventContent = document.getElementById('event-content');
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
    }

    setupEventListeners() {
        this.prevMonthButton.addEventListener('click', () => this.changeMonth(-1));
        this.nextMonthButton.addEventListener('click', () => this.changeMonth(1));
        this.overlay.addEventListener('click', () => this.hideAllModals());
        this.closeButton.addEventListener('click', () => this.hideEventDetails());
        this.addEventBtn.addEventListener('click', () => this.showAddEventModal());
        this.closeModalButton.addEventListener('click', () => this.hideAddEventModal());
        this.addEventForm.addEventListener('submit', this.handleAddEventBound);
        this.adminAccessBtn.addEventListener('click', () => this.showAdminModal());
        this.closeAdminModal.addEventListener('click', () => this.hideAdminModal());
        this.adminForm.addEventListener('submit', (e) => this.handleAdminLogin(e));
        this.scraperBtn.addEventListener('click', () => this.showScraperModal());
        this.closeScraperModal.addEventListener('click', () => this.hideScraperModal());
        this.scrapeButton.addEventListener('click', () => this.handleScrape());
        this.interpretButton.addEventListener('click', () => this.handleInterpret());
        this.toSqlButton.addEventListener('click', () => this.handleToSql());
        this.executeSqlButton.addEventListener('click', () => this.handleExecuteSql());
        // Add click listener to close popups when clicking outside
        document.addEventListener('click', (e) => {
            if (this.activePopup && !e.target.closest('.events-popup') && !e.target.closest('.more-events')) {
                this.hideEventPopup();
            }
        });

        // Initialize sidebar state
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');

        // Function to toggle sidebar
        function toggleSidebar() {
            sidebar.classList.toggle('collapsed');
            const icon = sidebarToggle.querySelector('i');
            if (sidebar.classList.contains('collapsed')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-chevron-right');
            } else {
                icon.classList.remove('fa-chevron-right');
                icon.classList.add('fa-bars');
            }
        }

        sidebarToggle.addEventListener('click', toggleSidebar);

        // Close sidebar on mobile when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target) && !sidebar.classList.contains('collapsed')) {
                    toggleSidebar();
                }
            }
        });
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

    showAdminModal() {
        this.overlay.classList.remove('hidden');
        this.adminModal.classList.remove('hidden');
        document.getElementById('admin-password').value = '';
    }

    hideAdminModal() {
        this.overlay.classList.add('hidden');
        this.adminModal.classList.add('hidden');
        this.adminForm.reset();
    }

    async handleAdminLogin(e) {
        e.preventDefault();
        const password = document.getElementById('admin-password').value;
        
        if (password === 'future') {
            this.isAdmin = true;
            document.documentElement.setAttribute('data-admin-mode', 'true');
            this.hideAdminModal();
            this.adminAccessBtn.textContent = 'Exit Admin Mode';
            this.adminAccessBtn.removeEventListener('click', () => this.showAdminModal());
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
        this.hideAdminModal();
        this.adminAccessBtn.addEventListener('click', () => this.showAdminModal());
        await this.renderCalendar();  // Refresh calendar to hide pending events
    }

    showEventDetails(event) {
        const content = document.getElementById('event-content');
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
        
        this.eventDetails.classList.remove('hidden');
        this.overlay.classList.remove('hidden');
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
        this.overlay.classList.add('hidden');
        this.eventDetails.classList.add('hidden');
    }

    showAddEventModal() {
        this.editingEventId = null;
        this.addEventForm.reset();
        this.submitButton.textContent = 'Add Event';
        this.addEventModal.classList.remove('hidden');
        this.overlay.classList.remove('hidden');
        
        // Ensure correct event handler
        this.addEventForm.removeEventListener('submit', this.handleEditEventBound);
        this.addEventForm.addEventListener('submit', this.handleAddEventBound);
    }

    hideAddEventModal() {
        this.overlay.classList.add('hidden');
        this.addEventModal.classList.add('hidden');
        this.addEventForm.reset();
        this.editingEventId = null;
        
        // Reset event handlers
        this.addEventForm.removeEventListener('submit', this.handleEditEventBound);
        this.addEventForm.addEventListener('submit', this.handleAddEventBound);
        this.submitButton.textContent = 'Add Event';
    }

    hideAllModals() {
        this.hideEventDetails();
        this.hideAddEventModal();
        this.hideAdminModal();
        this.hideScraperModal();
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
        this.addEventModal.classList.remove('hidden');
        this.overlay.classList.remove('hidden');
        
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
        this.hideEventPopup();

        const popup = document.createElement('div');
        popup.className = 'events-popup';
        
        events.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'event';
            eventElement.textContent = event.title;
            eventElement.addEventListener('click', () => this.showEventDetails(event));
            if (this.isAdmin) {
                eventElement.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.showEditEventModal(event);
                });
            }
            popup.appendChild(eventElement);
        });

        // Position the popup relative to the anchor element
        const rect = anchorElement.getBoundingClientRect();
        popup.style.left = `${rect.left}px`;
        popup.style.top = `${rect.bottom + window.scrollY + 5}px`;

        document.body.appendChild(popup);
        this.activePopup = popup;
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
                this.showEventPopup(remainingEvents, moreEventsElement);
            });
            eventsContainer.appendChild(moreEventsElement);
        }
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
        this.scraperModal.classList.remove('hidden');
        this.overlay.classList.remove('hidden');
    }

    hideScraperModal() {
        this.scraperModal.classList.add('hidden');
        this.overlay.classList.add('hidden');
    }

    async handleScrape() {
        const url = this.scraperUrl.value.trim();
        if (!url) {
            alert('Please enter a URL');
            return;
        }

        try {
            // Show loading state
            this.scrapeButton.disabled = true;
            this.scrapeButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scraping...';
            
            const response = await fetch('/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Update the scrape output with the raw text
            this.scrapeOutput.value = data.text;
            
            // Enable editing of the output
            this.scrapeOutput.disabled = false;
            
            // Show success message
            this.scrapeButton.innerHTML = '<i class="fas fa-check"></i> Content Retrieved';
            setTimeout(() => {
                this.scrapeButton.innerHTML = '<i class="fas fa-download"></i> Scrape';
                this.scrapeButton.disabled = false;
            }, 3000);

            // Enable the next step (AI interpretation)
            this.interpretButton.disabled = false;
        } 
        catch (error) {
            console.error('Scraping failed:', error);
            this.scrapeButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Failed';
            this.scrapeOutput.value = `Error: ${error.message}`;
            
            setTimeout(() => {
                this.scrapeButton.innerHTML = '<i class="fas fa-download"></i> Scrape';
                this.scrapeButton.disabled = false;
            }, 3000);
        }
    }

    async handleInterpret() {
        const text = this.scrapeOutput.value.trim();
        if (!text) {
            alert('No text to interpret');
            return;
        }

        try {
            // Show loading state
            this.interpretButton.disabled = true;
            this.interpretButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Interpreting...';

            const response = await fetch('/aiinterpret', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Update the interpret output with the result
            this.interpretOutput.value = data.text;
            
            // Enable editing of the output
            this.interpretOutput.disabled = false;
            
            // Show success message
            this.interpretButton.innerHTML = '<i class="fas fa-check"></i> Interpreted';
            setTimeout(() => {
                this.interpretButton.innerHTML = '<i class="fas fa-brain"></i> AI Interpret';
                this.interpretButton.disabled = false;
            }, 3000);

            // Enable the next step
            this.toSqlButton.disabled = false;
        } catch (error) {
            console.error('AI interpretation failed:', error);
            this.interpretButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Failed';
            alert('Failed to interpret the text: ' + error.message);
            
            setTimeout(() => {
                this.interpretButton.innerHTML = '<i class="fas fa-brain"></i> AI Interpret';
                this.interpretButton.disabled = false;
            }, 3000);
        }
    }

    async handleToSql() {
        const text = this.interpretOutput.value.trim();
        if (!text) {
            alert('No text to convert to SQL');
            return;
        }

        try {
            // Show loading state
            this.toSqlButton.disabled = true;
            this.toSqlButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';

            const response = await fetch('/eventsql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Update the SQL output with the result
            this.sqlOutput.value = data.sql;
            
            // Enable editing of the output
            this.sqlOutput.disabled = false;
            
            // Show success message
            this.toSqlButton.innerHTML = '<i class="fas fa-check"></i> Converted';
            setTimeout(() => {
                this.toSqlButton.innerHTML = '<i class="fas fa-database"></i> To SQL';
                this.toSqlButton.disabled = false;
            }, 3000);

            // Enable the next step
            this.executeSqlButton.disabled = false;
        } catch (error) {
            console.error('SQL conversion failed:', error);
            this.toSqlButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Failed';
            alert('Failed to convert to SQL: ' + error.message);
            
            setTimeout(() => {
                this.toSqlButton.innerHTML = '<i class="fas fa-database"></i> To SQL';
                this.toSqlButton.disabled = false;
            }, 3000);
        }
    }

    async handleExecuteSql() {
        const sql = this.sqlOutput.value.trim();
        if (!sql) {
            alert('No SQL to execute');
            return;
        }

        try {
            // Show loading state
            this.executeSqlButton.disabled = true;
            this.executeSqlButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Executing...';

            const response = await fetch('/executesql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sql }),
            });
            const data = await response.json();
            
            if (data.success) {
                // Show success message
                this.executeSqlButton.innerHTML = '<i class="fas fa-check"></i> Success';
                setTimeout(() => {
                    this.executeSqlButton.innerHTML = '<i class="fas fa-play"></i> Execute SQL';
                    this.executeSqlButton.disabled = false;
                }, 2000);

                // Hide modal and refresh calendar immediately
                this.hideScraperModal();
                await this.renderCalendar();
            } else {
                throw new Error(data.error || 'Failed to execute SQL');
            }
        } catch (error) {
            console.error('SQL execution failed:', error);
            this.executeSqlButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Failed';
            alert('Failed to execute SQL: ' + error.message);
            
            setTimeout(() => {
                this.executeSqlButton.innerHTML = '<i class="fas fa-play"></i> Execute SQL';
                this.executeSqlButton.disabled = false;
            }, 2000);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const calendar = new Calendar();
    window.calendar = calendar;
});
