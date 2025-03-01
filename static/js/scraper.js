class Scraper {
    constructor() {
        this.currentStep = 0;
        this.scrapedContent = null;
        this.interpretedEvents = null;
        this.sqlCommands = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Source checkboxes
        const tridentCheckbox = document.getElementById('trident-checkbox');
        if (tridentCheckbox) {
            tridentCheckbox.addEventListener('change', () => {
                if (tridentCheckbox.checked) {
                    this.scrapeTrident();
                }
            });
        }

        // Scraper buttons
        const scrapeButton = document.getElementById('scrape-button');
        const interpretButton = document.getElementById('interpret-button');
        const executeButton = document.getElementById('execute-button');
        
        if (scrapeButton) {
            scrapeButton.addEventListener('click', () => this.scrapeUrl());
        }
        
        if (interpretButton) {
            interpretButton.addEventListener('click', () => this.interpretEvents());
        }
        
        if (executeButton) {
            executeButton.addEventListener('click', () => this.executeSql());
        }
    }

    async scrapeTrident() {
        try {
            this.updateStatus('Scraping Trident Cafe events...', 33);
            
            const response = await fetch('/api/scraper/trident');
            if (!response.ok) throw new Error('Failed to scrape Trident');
            
            const data = await response.json();
            this.scrapedContent = data;
            
            this.updateOutput('scrape-output', JSON.stringify(data, null, 2));
            this.enableButton('interpret-button');
            this.updateStatus('Trident events scraped successfully!', 100);
            
        } catch (error) {
            console.error('Error scraping Trident:', error);
            this.updateStatus('Failed to scrape Trident events', 0);
            this.showMessage('Failed to scrape Trident events', 'error');
        }
    }

    async scrapeUrl() {
        const urlInput = document.getElementById('scraper-url');
        if (!urlInput || !urlInput.value) {
            this.showMessage('Please enter a URL to scrape', 'error');
            return;
        }

        try {
            this.updateStatus('Scraping URL...', 33);
            
            const response = await fetch('/api/scraper/url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: urlInput.value
                })
            });
            
            if (!response.ok) throw new Error('Failed to scrape URL');
            
            const data = await response.json();
            this.scrapedContent = data;
            
            this.updateOutput('scrape-output', JSON.stringify(data, null, 2));
            this.enableButton('interpret-button');
            this.updateStatus('URL scraped successfully!', 100);
            
        } catch (error) {
            console.error('Error scraping URL:', error);
            this.updateStatus('Failed to scrape URL', 0);
            this.showMessage('Failed to scrape URL', 'error');
        }
    }

    async interpretEvents() {
        if (!this.scrapedContent) {
            this.showMessage('No content to interpret', 'error');
            return;
        }

        try {
            this.updateStatus('Interpreting events...', 66);
            
            const response = await fetch('/api/scraper/interpret', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: this.scrapedContent
                })
            });
            
            if (!response.ok) throw new Error('Failed to interpret events');
            
            const data = await response.json();
            this.interpretedEvents = data;
            
            this.updateOutput('interpret-output', JSON.stringify(data, null, 2));
            this.enableButton('execute-button');
            this.updateStatus('Events interpreted successfully!', 100);
            
        } catch (error) {
            console.error('Error interpreting events:', error);
            this.updateStatus('Failed to interpret events', 66);
            this.showMessage('Failed to interpret events', 'error');
        }
    }

    async executeSql() {
        if (!this.interpretedEvents) {
            this.showMessage('No events to execute', 'error');
            return;
        }

        try {
            this.updateStatus('Executing SQL...', 100);
            
            const response = await fetch('/api/scraper/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    events: this.interpretedEvents
                })
            });
            
            if (!response.ok) throw new Error('Failed to execute SQL');
            
            this.showMessage('Events added successfully!');
            this.updateStatus('Events added successfully!', 100);
            
            // Refresh calendar
            if (window.calendar) {
                window.calendar.renderCalendar();
            }
            
        } catch (error) {
            console.error('Error executing SQL:', error);
            this.updateStatus('Failed to execute SQL', 100);
            this.showMessage('Failed to execute SQL', 'error');
        }
    }

    updateOutput(elementId, content) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = content;
        }
    }

    enableButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = false;
        }
    }

    updateStatus(message, progress) {
        const statusMessage = document.querySelector('.status-message');
        const progressBar = document.querySelector('.progress');
        
        if (statusMessage) {
            statusMessage.textContent = message;
        }
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
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

// Initialize scraper when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.scraper = new Scraper();
});
