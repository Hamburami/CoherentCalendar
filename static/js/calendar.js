console.log('Calendar script loaded');
class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.events = [];
        this.isAdmin = false;
        this.editingEventId = null;
        this.activePopup = null;
        this.initializeElements();
        this.setupEventListeners();
        this.renderCalendar();
    }

    initializeElements() {
        this.adminAccessBtn = document.getElementById('adminAccessBtn');
        if (!this.adminAccessBtn) {
            console.error('adminAccessBtn not found');
        }
        this.calendarGrid = document.getElementById('calendar-grid');
        this.currentMonthElement = document.getElementById('currentMonth');
        this.prevMonthButton = document.getElementById('prevMonth');
        this.nextMonthButton = document.getElementById('nextMonth');
        this.eventDetails = document.getElementById('event-details');
        this.eventContent = document.getElementById('event-content');
        this.overlay = document.getElementById('overlay');
        this.closeButton = document.getElementById('close-button');
        this.adminAccessBtn = document.getElementById('adminAccessBtn');
        this.adminModal = document.getElementById('admin-modal');
        this.closeAdminModalButton = document.getElementById('close-admin-modal');
        this.addEventBtn = document.getElementById('addEventBtn');
        this.addEventModal = document.getElementById('add-event-modal');
        this.closeModalButton = document.getElementById('close-modal-button');
        this.addEventForm = document.getElementById('add-event-form');
    }

    setupEventListeners() {
        this.prevMonthButton.addEventListener('click', () => this.changeMonth(-1));
        this.nextMonthButton.addEventListener('click', () => this.changeMonth(1));
        this.overlay.addEventListener('click', () => this.hideAllModals());
        this.closeButton.addEventListener('click', () => this.hideEventDetails());
        this.adminAccessBtn.addEventListener('click', () => this.showAdminModal());
        this.closeAdminModalButton.addEventListener('click', () => this.hideAdminModal());
        this.addEventBtn.addEventListener('click', () => this.showAddEventModal());
        this.closeModalButton.addEventListener('click', () => this.hideAddEventModal());
        this.addEventForm.addEventListener('submit', (e) => this.handleAddEvent(e));
        // Add click listener to close popups when clicking outside
        document.addEventListener('click', (e) => {
            if (this.activePopup && !e.target.closest('.events-popup') && !e.target.closest('.more-events')) {
                this.hideEventPopup();
            }
        });
    }

    async fetchEvents() {
        try {
            const response = await fetch(`/api/events/${this.currentDate.getFullYear()}/${this.currentDate.getMonth() + 1}`);
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

    handleAdminLogin(e) {
        e.preventDefault();
        const password = document.getElementById('admin-password').value;
        
        if (password === 'future') {
            this.isAdmin = true;
            document.documentElement.setAttribute('data-admin-mode', 'true');
            this.hideAdminModal();
            this.adminAccessBtn.textContent = 'Exit Admin Mode';
            this.adminAccessBtn.removeEventListener('click', () => this.showAdminModal());
            this.adminAccessBtn.addEventListener('click', () => this.exitAdminMode());
        } else {
            alert('Incorrect password');
        }
    }

    exitAdminMode() {
        this.isAdmin = false;
        document.documentElement.setAttribute('data-admin-mode', 'false');
        this.adminAccessBtn.textContent = 'Admin Access';
        this.hideAdminModal();
        this.adminAccessBtn.addEventListener('click', () => this.showAdminModal());
    }

    showEventDetails(event) {
        let content = `
            <h4>${event.title}</h4>
            <p><strong>Date:</strong> ${this.formatDisplayDate(event.date)}</p>
            ${event.time ? `<p><strong>Time:</strong> ${event.time}</p>` : ''}
            ${event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : ''}
            ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
            ${event.url ? `<p><a href="${event.url}" target="_blank">More Information</a></p>` : ''}
        `;

        if (this.isAdmin) {
            content += `
                <button class="edit-event-btn" onclick="calendar.editEvent(${JSON.stringify(event).replace(/"/g, '&quot;')})">
                    Edit Event
                </button>
                <button class="delete-event-btn" onclick="calendar.deleteEvent(${event.id})">
                    Delete Event
                </button>
            `;
        }

        this.eventContent.innerHTML = content;
        this.overlay.classList.remove('hidden');
        this.eventDetails.classList.remove('hidden');
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
        this.overlay.classList.remove('hidden');
        this.addEventModal.classList.remove('hidden');
        
        if (!this.editingEventId) {
            this.addEventForm.reset();
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            document.getElementById('event-date').value = `${year}-${month}-${day}`;
            this.addEventForm.onsubmit = (e) => this.handleAddEvent(e);
        }
    }

    hideAddEventModal() {
        this.overlay.classList.add('hidden');
        this.addEventModal.classList.add('hidden');
    }

    hideAllModals() {
        this.hideEventDetails();
        this.hideAddEventModal();
        this.hideAdminModal();
    }

    async handleAddEvent(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('event-title').value,
            date: document.getElementById('event-date').value,
            time: document.getElementById('event-time').value || null,
            location: document.getElementById('event-location').value || null,
            description: document.getElementById('event-description').value || null
        };

        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Hide the modal and refresh the calendar
            this.hideAddEventModal();
            await this.renderCalendar();
        } catch (error) {
            console.error('Error adding event:', error);
            alert('Failed to add event. Please try again.');
        }
    }

    editEvent(event) {
        this.hideEventDetails();
        this.editingEventId = event.id;
        this.showAddEventModal();
        
        // Set form values
        document.getElementById('event-title').value = event.title;
        document.getElementById('event-date').value = event.date;
        document.getElementById('event-time').value = event.time || '';
        document.getElementById('event-location').value = event.location || '';
        document.getElementById('event-description').value = event.description || '';
        
        // Update UI for edit mode
        const submitBtn = this.addEventForm.querySelector('.submit-btn');
        submitBtn.textContent = 'Update Event';
        
        // Replace form to clean up event handlers
        const newForm = this.addEventForm.cloneNode(true);
        this.addEventForm.parentNode.replaceChild(newForm, this.addEventForm);
        this.addEventForm = newForm;
        
        // Add edit submit handler
        this.addEventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                title: document.getElementById('event-title').value,
                date: document.getElementById('event-date').value,
                time: document.getElementById('event-time').value || null,
                location: document.getElementById('event-location').value || null,
                description: document.getElementById('event-description').value || null
            };
            
            try {
                const response = await fetch(`/api/events/${this.editingEventId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // Reset UI state
                this.hideAddEventModal();
                this.addEventForm.reset();
                submitBtn.textContent = 'Add Event';
                this.editingEventId = null;
                
                // Refresh calendar
                await this.renderCalendar();
            } catch (error) {
                console.error('Error updating event:', error);
                alert('Failed to update event. Please try again.');
            }
        }, { once: true });
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
                    this.editEvent(event);
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
            eventElement.textContent = event.title;
            eventElement.addEventListener('click', () => this.showEventDetails(event));
            if (this.isAdmin) {
                eventElement.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.editEvent(event);
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

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const calendar = new Calendar();
    window.calendar = calendar;
});
