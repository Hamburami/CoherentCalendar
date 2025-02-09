console.log('Calendar script loaded');
class Calendar {

    constructor() {
        this.currentDate = new Date();
        this.events = [];
        this.initializeElements();
        this.setupEventListeners();
        this.renderCalendar();
    }

    initializeElements() {
        this.adminAccessBtn = document.getElementById('adminAccessBtn');
        console.log('Admin Access Button:', this.adminAccessBtn);  // Add this log
        this.addEventBtn = document.getElementById('addEventBtn');
        console.log('Add Event Button:', this.addEventBtn);  // Add this log
    
        if (!this.adminAccessBtn) {
            console.error('adminAccessBtn not found');
        }
        if (!this.addEventBtn) {
            console.error('addEventBtn not found');
        }
    
        this.calendarGrid = document.getElementById('calendar-grid');
        this.currentMonthElement = document.getElementById('currentMonth');
        this.prevMonthButton = document.getElementById('prevMonth');
        this.nextMonthButton = document.getElementById('nextMonth');
        this.eventDetails = document.getElementById('event-details');
        this.eventContent = document.getElementById('event-content');
        this.overlay = document.getElementById('overlay');
        this.closeButton = document.getElementById('close-button');
        this.adminModal = document.getElementById('admin-modal');
        this.closeAdminModalButton = document.getElementById('close-admin-modal');
        this.addEventModal = document.getElementById('add-event-modal');
        this.closeModalButton = document.getElementById('close-modal-button');
        this.addEventForm = document.getElementById('add-event-form');
    }
    

    setupEventListeners() {
        if (this.prevMonthButton) this.prevMonthButton.addEventListener('click', () => this.changeMonth(-1));
        if (this.nextMonthButton) this.nextMonthButton.addEventListener('click', () => this.changeMonth(1));
        if (this.overlay) this.overlay.addEventListener('click', () => this.hideAllModals());
        if (this.closeButton) this.closeButton.addEventListener('click', () => this.hideEventDetails());
        if (this.adminAccessBtn) {
            this.adminAccessBtn.addEventListener('click', () => {
                console.log('Admin Access Button Clicked');  // Add this line
                this.showAdminModal();
            });
        }
        
        if (this.closeAdminModalButton) this.closeAdminModalButton.addEventListener('click', () => this.hideAdminModal());
        if (this.addEventBtn) {
            this.addEventBtn.addEventListener('click', () => {
                console.log('Add Event Button Clicked');  // Add this line
                this.showAddEventModal();
            });
        }
        
        if (this.closeModalButton) this.closeModalButton.addEventListener('click', () => this.hideAddEventModal());
        if (this.addEventForm) this.addEventForm.addEventListener('submit', (e) => this.handleAddEvent(e));
    }
    

    async fetchEvents() {
        try {
            const response = await fetch(`/api/events/${this.currentDate.getFullYear()}/${this.currentDate.getMonth() + 1}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
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

    showAdminModal() {
        this.adminModal.classList.remove('hidden');
        this.overlay.classList.remove('hidden');
    
        // Create the password input if it doesn't exist
        if (!document.getElementById('admin-password-input')) {
            const passwordInput = document.createElement('input');
            passwordInput.type = 'password';
            passwordInput.id = 'admin-password-input';
            passwordInput.className = 'form-control';
            passwordInput.placeholder = 'Enter Admin Password';
            
            const submitButton = document.createElement('button');
            submitButton.textContent = 'Submit';
            submitButton.className = 'btn-submit';
            
            submitButton.addEventListener('click', () => this.validateAdminPassword(passwordInput.value));
            
            const modalContent = this.adminModal.querySelector('.modal-content');
            modalContent.appendChild(passwordInput);
            modalContent.appendChild(submitButton);
        }
        console.log('Admin Access');
    }  

    hideAdminModal() {
        this.adminModal.classList.add('hidden');
        this.overlay.classList.add('hidden');
        // Remove the textbox
        const passwordInput = document.getElementById('admin-password-input');
        if (passwordInput) {
            passwordInput.remove();
        }
    }

    showAddEventModal() {
        console.log('Opening Add Event Modal');
        this.addEventModal.classList.remove('hidden');
        this.overlay.classList.remove('hidden');
    }

    hideAddEventModal() {
        console.log('Opening Admin Modal');
        this.addEventModal.classList.add('hidden');
        this.overlay.classList.add('hidden');
    }

    handleAddEvent(e) {
        e.preventDefault();
        const title = document.getElementById('event-title').value;
        const date = document.getElementById('event-date').value;
        const time = document.getElementById('event-time').value;
        const location = document.getElementById('event-location').value;
        const description = document.getElementById('event-description').value;

        const newEvent = {
            title,
            date,
            time,
            location,
            description
        };

        this.events.push(newEvent);
        this.renderCalendar();
        this.hideAddEventModal();
    }

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
    }

    hideAllModals() {
        console.log('Overlay Clicked - Hiding all modals');
        this.hideEventDetails();
        this.hideAdminModal();
        this.hideAddEventModal();
    }

    validateAdminPassword(password) {
        // Add your password validation logic here
        if (password === 'admin') {
            this.isAdmin = true;
            alert('Admin access granted');
            this.hideAdminModal();
        } else {
            alert('Invalid password');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    new Calendar();
});
