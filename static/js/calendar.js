class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.events = [];
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
    }

    setupEventListeners() {
        this.prevMonthButton.addEventListener('click', () => this.changeMonth(-1));
        this.nextMonthButton.addEventListener('click', () => this.changeMonth(1));
        this.overlay.addEventListener('click', () => this.hideAllModals());
        this.closeButton.addEventListener('click', () => this.hideEventDetails());
        this.addEventBtn.addEventListener('click', () => this.showAddEventModal());
        this.closeModalButton.addEventListener('click', () => this.hideAddEventModal());
        this.addEventForm.addEventListener('submit', (e) => this.handleAddEvent(e));
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
            
            if (dayEvents.length > 0) {
                const eventsContainer = dayElement.querySelector('.events-container');
                dayEvents.forEach(event => {
                    const eventElement = document.createElement('div');
                    eventElement.className = 'event';
                    eventElement.textContent = event.title;
                    eventElement.title = `${event.title}${event.time ? ` - ${event.time}` : ''}`;
                    eventElement.addEventListener('click', () => this.showEventDetails(event));
                    eventsContainer.appendChild(eventElement);
                });
            }
            
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

    showEventDetails(event) {
        this.eventContent.innerHTML = `
            <h4>${event.title}</h4>
            <p><strong>Date:</strong> ${event.date}</p>
            ${event.time ? `<p><strong>Time:</strong> ${event.time}</p>` : ''}
            ${event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : ''}
            ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
            ${event.url ? `<p><a href="${event.url}" target="_blank">More Information</a></p>` : ''}
        `;
        this.overlay.classList.remove('hidden');
        this.eventDetails.classList.remove('hidden');
    }

    hideEventDetails() {
        this.overlay.classList.add('hidden');
        this.eventDetails.classList.add('hidden');
    }

    showAddEventModal() {
        this.overlay.classList.remove('hidden');
        this.addEventModal.classList.remove('hidden');
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('event-date').value = today;
    }

    hideAddEventModal() {
        this.overlay.classList.add('hidden');
        this.addEventModal.classList.add('hidden');
        this.addEventForm.reset();
    }

    hideAllModals() {
        this.hideEventDetails();
        this.hideAddEventModal();
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

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Calendar();
});
