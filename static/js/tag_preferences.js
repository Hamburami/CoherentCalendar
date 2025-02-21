class TagPreferences {
    constructor() {
        this.currentTag = null;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isDragging = false;
        this.cardTranslateX = 0;
        this.cardRotation = 0;

        this.modal = document.getElementById('tag-preferences-modal');
        this.card = document.getElementById('current-tag-card');
        this.tagName = this.card.querySelector('.tag-name');
        this.sampleEvents = this.card.querySelector('.tag-sample-events');
        this.likeButton = document.getElementById('like-tag');
        this.dislikeButton = document.getElementById('dislike-tag');
        this.closeButton = document.getElementById('close-tag-preferences-modal');
        this.recommendedEventsSection = document.getElementById('recommended-events');
        this.recommendedEventsList = document.querySelector('.recommended-events-list');

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Button to open preferences
        document.getElementById('tagPreferencesBtn').addEventListener('click', () => {
            if (!window.isAuthenticated) {
                alert('Please log in to set your event preferences');
                return;
            }
            this.open();
        });

        // Close button
        this.closeButton.addEventListener('click', () => this.close());

        // Touch/Mouse events for swiping
        this.card.addEventListener('mousedown', (e) => this.handleDragStart(e));
        this.card.addEventListener('mousemove', (e) => this.handleDragMove(e));
        this.card.addEventListener('mouseup', () => this.handleDragEnd());
        this.card.addEventListener('mouseleave', () => this.handleDragEnd());

        this.card.addEventListener('touchstart', (e) => this.handleDragStart(e));
        this.card.addEventListener('touchmove', (e) => this.handleDragMove(e));
        this.card.addEventListener('touchend', () => this.handleDragEnd());

        // Button clicks
        this.likeButton.addEventListener('click', () => this.handlePreference(1));
        this.dislikeButton.addEventListener('click', () => this.handlePreference(-1));
    }

    getAuthHeaders() {
        const token = window.authToken;
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    async open() {
        if (!window.authToken) {
            alert('Please log in to set your event preferences');
            return;
        }
        this.modal.classList.remove('hidden');
        await this.loadNextTag();
        await this.loadRecommendedEvents();
    }

    close() {
        this.modal.classList.add('hidden');
    }

    handleDragStart(e) {
        this.isDragging = true;
        this.card.classList.add('swiping');
        
        if (e.type === 'mousedown') {
            this.touchStartX = e.clientX;
            this.touchStartY = e.clientY;
        } else {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }
    }

    handleDragMove(e) {
        if (!this.isDragging) return;

        e.preventDefault();
        
        const currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const currentY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
        
        this.cardTranslateX = currentX - this.touchStartX;
        this.cardRotation = this.cardTranslateX * 0.1;
        
        this.card.style.transform = `translateX(${this.cardTranslateX}px) rotate(${this.cardRotation}deg)`;
    }

    async handleDragEnd() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.card.classList.remove('swiping');
        
        if (Math.abs(this.cardTranslateX) > 100) {
            // Swipe was long enough to trigger preference
            const preference = this.cardTranslateX > 0 ? 1 : -1;
            await this.handlePreference(preference);
        } else {
            // Reset card position
            this.card.style.transform = '';
        }
        
        this.cardTranslateX = 0;
        this.cardRotation = 0;
    }

    async handlePreference(preference) {
        if (!this.currentTag) return;

        try {
            const response = await fetch(`/api/preferences/tags/${this.currentTag.id}`, {
                method: 'POST',
                headers: {
                    ...this.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ preference })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save preference');
            }

            // Load next tag
            await this.loadNextTag();
            
        } catch (error) {
            console.error('Error saving preference:', error);
            alert(error.message);
        }
    }

    async loadNextTag() {
        try {
            const response = await fetch('/api/preferences/tags/next', {
                headers: this.getAuthHeaders()
            });

            if (response.status === 401) {
                // Token expired or invalid
                window.isAuthenticated = false;
                window.authToken = null;
                localStorage.removeItem('token');
                alert('Your session has expired. Please log in again.');
                this.close();
                return;
            }

            const data = await response.json();
            
            // Handle 404 (no more tags)
            if (response.status === 404) {
                this.card.innerHTML = `
                    <div class="no-more-tags">
                        <h3>All Done!</h3>
                        <p>You've rated all available tags. Check out your recommended events below!</p>
                    </div>
                `;
                this.likeButton.disabled = true;
                this.dislikeButton.disabled = true;
                await this.loadRecommendedEvents();
                return;
            }

            // Handle other errors
            if (!response.ok) {
                throw new Error(data.error || 'Failed to load next tag');
            }

            // Update the card with tag data
            this.currentTag = data;
            this.tagName.textContent = data.name;
            this.card.style.backgroundColor = data.color || '#808080';
            
            // Reset buttons
            this.likeButton.disabled = false;
            this.dislikeButton.disabled = false;

            // Load sample events for this tag
            await this.loadSampleEvents();

        } catch (error) {
            console.error('Error loading next tag:', error);
            alert(error.message);
        }
    }

    async loadSampleEvents() {
        if (!this.currentTag) return;

        try {
            const response = await fetch(`/api/events?tag_id=${this.currentTag.id}&limit=3`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to load sample events');
            }

            const events = await response.json();
            
            this.sampleEvents.innerHTML = events.length ? events.map(event => `
                <div class="tag-sample-event">
                    <div class="event-title">${event.title}</div>
                    <div class="event-date">${event.date}${event.time ? ' ' + event.time : ''}</div>
                    ${event.location ? `<div class="event-location">${event.location}</div>` : ''}
                </div>
            `).join('') : '<p class="no-events">No upcoming events with this tag</p>';

        } catch (error) {
            console.error('Error loading sample events:', error);
            this.sampleEvents.innerHTML = '<p class="error">Failed to load sample events</p>';
        }
    }

    async loadRecommendedEvents() {
        try {
            const response = await fetch('/api/preferences/recommended-events', {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                if (response.status === 401) {
                    alert('Your session has expired. Please log in again.');
                    window.location.reload();
                    return;
                }
                throw new Error('Failed to load recommended events');
            }

            const events = await response.json();
            
            if (events.length > 0) {
                this.recommendedEventsSection.classList.remove('hidden');
                this.recommendedEventsList.innerHTML = events.map(event => `
                    <div class="recommended-event-card" data-event-id="${event.id}">
                        <h4>${event.title}</h4>
                        <div class="recommended-event-meta">
                            <div>${new Date(event.date).toLocaleDateString()}</div>
                            ${event.location ? `<div>${event.location}</div>` : ''}
                        </div>
                        <div class="event-tags">
                            ${event.tags.map(tag => `
                                <span class="event-tag" style="background-color: ${tag.color}">
                                    ${tag.name}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                `).join('');

                // Add click handlers for recommended events
                this.recommendedEventsList.querySelectorAll('.recommended-event-card').forEach(card => {
                    card.addEventListener('click', () => {
                        const eventId = card.dataset.eventId;
                        window.calendar.showEventDetails(eventId);
                    });
                });
            } else {
                this.recommendedEventsSection.classList.add('hidden');
            }

        } catch (error) {
            console.error('Error loading recommended events:', error);
        }
    }
}

// Initialize tag preferences when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tagPreferences = new TagPreferences();
});
