/**
 * Error handling utility for user-facing error messages
 */

export const ErrorHandler = {
    /**
     * Show a toast notification
     * @param {string} message - Error message to display
     * @param {string} type - Message type: 'error', 'warning', 'info', 'success'
     * @param {number} duration - Duration in ms (0 = persistent)
     */
    showToast(message, type = 'error', duration = 5000) {
        const container = document.querySelector('.error-toast-container');
        if (!container) {
            console.error('Toast container not found');
            return;
        }

        const toast = document.createElement('div');
        toast.className = `error-toast error-toast-${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto-remove if duration is set
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    },

    /**
     * Show error state in the main container
     * @param {HTMLElement} container - Container element
     * @param {string} message - Error message
     * @param {Function} onRetry - Optional retry callback
     */
    showErrorState(container, message, onRetry = null) {
        container.innerHTML = `
            <div class="error-state">
                <i class="fi-alert"></i>
                <h3>Oops! Something went wrong</h3>
                <p>${message}</p>
                ${onRetry ? '<button class="button retry-button">Try Again</button>' : ''}
            </div>
        `;

        if (onRetry) {
            container.querySelector('.retry-button')?.addEventListener('click', onRetry);
        }
    },

    /**
     * Get user-friendly error message based on error type
     * @param {Error} error - Error object
     * @returns {string} User-friendly message
     */
    getUserMessage(error) {
        const message = error.message || '';

        // Network errors
        if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
            return 'Unable to connect to Sonarr. Please check your connection and Sonarr server status.';
        }

        // Authentication errors
        if (message.includes('401') || message.includes('Unauthorized')) {
            return 'Authentication failed. Please check your API key in the Options page.';
        }

        // Not found errors
        if (message.includes('404')) {
            return 'Resource not found. Your Sonarr version may not support this feature.';
        }

        // Server errors
        if (message.includes('500') || message.includes('502') || message.includes('503')) {
            return 'Sonarr server error. Please check your Sonarr instance.';
        }

        // Timeout errors
        if (message.includes('timeout')) {
            return 'Request timed out. Sonarr may be slow or unreachable.';
        }

        // Generic error
        return `Error: ${message}`;
    },

    /**
     * Clear all toasts
     */
    clearToasts() {
        const container = document.querySelector('.error-toast-container');
        if (container) {
            container.innerHTML = '';
        }
    }
};
