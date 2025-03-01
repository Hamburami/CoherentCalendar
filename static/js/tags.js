class TagManager {
    constructor() {
        this.tags = [];
        this.userPreferences = new Set();
        this.setupEventListeners();
        this.loadTags();
    }

    setupEventListeners() {
        // Tag preference buttons in the preferences container
        const preferencesContainer = document.getElementById('preferences-container');
        if (preferencesContainer) {
            preferencesContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('tag-item')) {
                    this.handleTagClick(e.target);
                }
            });
        }

        // Event tag selector in add event form
        const tagSelector = document.querySelector('.tag-selector');
        if (tagSelector) {
            tagSelector.addEventListener('change', (e) => {
                if (e.target.type === 'checkbox') {
                    this.handleTagSelection(e.target);
                }
            });
        }
    }

    async loadTags() {
        try {
            const response = await fetch('/api/tags');
            if (!response.ok) throw new Error('Failed to load tags');
            
            this.tags = await response.json();
            this.renderTags();
            
            // Load user preferences if authenticated
            if (window.auth && window.auth.isAuthenticated) {
                this.loadUserPreferences();
            }
            
        } catch (error) {
            console.error('Error loading tags:', error);
            this.showMessage('Failed to load tags', 'error');
        }
    }

    async loadUserPreferences() {
        try {
            const response = await fetch('/api/tags/preferences');
            if (!response.ok) throw new Error('Failed to load tag preferences');
            
            const preferences = await response.json();
            this.userPreferences = new Set(preferences.map(p => p.tag_id));
            this.updateTagUI();
            
        } catch (error) {
            console.error('Error loading tag preferences:', error);
        }
    }

    renderTags() {
        // Render tags in preferences container
        const tagList = document.querySelector('.tag-list');
        if (tagList) {
            tagList.innerHTML = this.tags.map(tag => `
                <div class="tag-item ${this.userPreferences.has(tag.id) ? 'selected' : ''}" 
                     data-tag-id="${tag.id}">
                    <span class="tag-name">${tag.name}</span>
                    <span class="tag-count">${tag.event_count || 0}</span>
                </div>
            `).join('');
        }

        // Render tags in event form
        const tagSelector = document.querySelector('.tag-selector');
        if (tagSelector) {
            tagSelector.innerHTML = this.tags.map(tag => `
                <div class="tag-checkbox">
                    <input type="checkbox" id="tag-${tag.id}" name="tags[]" value="${tag.id}">
                    <label for="tag-${tag.id}">${tag.name}</label>
                </div>
            `).join('');
        }
    }

    async handleTagClick(tagElement) {
        if (!window.auth || !window.auth.isAuthenticated) {
            this.showMessage('Please login to set tag preferences', 'error');
            return;
        }

        const tagId = tagElement.dataset.tagId;
        const isSelected = tagElement.classList.contains('selected');
        
        try {
            const response = await fetch('/api/tags/preferences', {
                method: isSelected ? 'DELETE' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tag_id: tagId })
            });
            
            if (!response.ok) throw new Error('Failed to update tag preference');
            
            if (isSelected) {
                this.userPreferences.delete(tagId);
                tagElement.classList.remove('selected');
            } else {
                this.userPreferences.add(tagId);
                tagElement.classList.add('selected');
            }
            
            this.loadTagDetails(tagId);
            
        } catch (error) {
            console.error('Error updating tag preference:', error);
            this.showMessage('Failed to update tag preference', 'error');
        }
    }

    async loadTagDetails(tagId) {
        try {
            const response = await fetch(`/api/tags/${tagId}/details`);
            if (!response.ok) throw new Error('Failed to load tag details');
            
            const details = await response.json();
            this.updateTagDetails(details);
            
        } catch (error) {
            console.error('Error loading tag details:', error);
        }
    }

    updateTagDetails(details) {
        const tagStats = document.querySelector('.tag-stats');
        if (tagStats) {
            tagStats.innerHTML = `
                <p>Total Events: ${details.event_count}</p>
                <p>Upcoming Events: ${details.upcoming_count}</p>
                <p>Users Interested: ${details.user_count}</p>
            `;
        }

        const eventList = document.querySelector('.event-list');
        if (eventList) {
            eventList.innerHTML = details.events.map(event => `
                <div class="event-item">
                    <h4>${event.title}</h4>
                    <p>${event.date} ${event.time || ''}</p>
                    <p>${event.description || ''}</p>
                </div>
            `).join('');
        }
    }

    handleTagSelection(checkbox) {
        const tagId = checkbox.value;
        const selectedTags = document.querySelectorAll('.tag-selector input:checked');
        
        // Optional: Limit number of tags per event
        if (selectedTags.length > 5) {
            checkbox.checked = false;
            this.showMessage('Maximum 5 tags per event', 'error');
        }
    }

    updateTagUI() {
        // Update tag items in preferences
        document.querySelectorAll('.tag-item').forEach(item => {
            const tagId = item.dataset.tagId;
            if (this.userPreferences.has(tagId)) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });

        // Update tag cloud in profile
        const tagCloud = document.getElementById('user-tags');
        if (tagCloud) {
            tagCloud.innerHTML = Array.from(this.userPreferences)
                .map(tagId => this.tags.find(t => t.id === tagId))
                .filter(Boolean)
                .map(tag => `<span class="tag">${tag.name}</span>`)
                .join('');
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

// Initialize tag manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tagManager = new TagManager();
});
