/**
 * Base Game Class
 * All games should extend this class and implement required methods
 */

export default class Game {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.icon = config.icon;
        this.container = null;
        this.eventListeners = [];
        
        // Lifecycle tracking
        this.isMounted = false;
        
        // Automatic cleanup tracking
        this.activeIntervals = [];
        this.activeTimeouts = [];
        this.activeAnimationFrames = [];
        this.activeResizeHandlers = [];
    }

    /**
     * Mount the game to a container
     * Child classes should call super.mount(container) then implement their own logic
     */
    mount(container) {
        this.container = container;
        this.isMounted = true;
    }

    /**
     * Unmount the game and clean up resources
     * Must be implemented by child classes
     */
    unmount() {
        this.isMounted = false;
        this.cleanup();
        if (this.container) {
            this.container.innerHTML = '';
            this.container = null;
        }
    }

    /**
     * Cleanup resources (event listeners, intervals, timeouts, etc.)
     * Automatically clears all tracked intervals, timeouts, and animation frames
     */
    cleanup() {
        // Remove all registered event listeners
        this.eventListeners.forEach(({ element, type, handler }) => {
            try {
                if (element && element.removeEventListener) {
                    element.removeEventListener(type, handler);
                }
            } catch (e) {
                console.error('Error removing event listener:', e);
            }
        });
        this.eventListeners = [];

        // Clear all tracked intervals
        this.activeIntervals.forEach(id => {
            try {
                clearInterval(id);
            } catch (e) {
                console.error('Error clearing interval:', e);
            }
        });
        this.activeIntervals = [];

        // Clear all tracked timeouts
        this.activeTimeouts.forEach(id => {
            try {
                clearTimeout(id);
            } catch (e) {
                console.error('Error clearing timeout:', e);
            }
        });
        this.activeTimeouts = [];

        // Cancel all tracked animation frames
        this.activeAnimationFrames.forEach(id => {
            try {
                cancelAnimationFrame(id);
            } catch (e) {
                console.error('Error canceling animation frame:', e);
            }
        });
        this.activeAnimationFrames = [];

        // Remove all tracked resize handlers
        this.activeResizeHandlers.forEach(handler => {
            try {
                window.removeEventListener('resize', handler);
            } catch (e) {
                console.error('Error removing resize handler:', e);
            }
        });
        this.activeResizeHandlers = [];
    }

    /**
     * Register an event listener for automatic cleanup
     */
    addEventListener(element, type, handler, options) {
        element.addEventListener(type, handler, options);
        this.eventListeners.push({ element, type, handler });
    }

    /**
     * Wrapper for setInterval that automatically tracks and clears the interval
     * @param {Function} callback - Function to execute
     * @param {number} delay - Delay in milliseconds
     * @returns {number} Interval ID
     */
    setGameInterval(callback, delay) {
        const id = setInterval(callback, delay);
        this.activeIntervals.push(id);
        return id;
    }

    /**
     * Wrapper for setTimeout that automatically tracks and clears the timeout
     * @param {Function} callback - Function to execute
     * @param {number} delay - Delay in milliseconds
     * @returns {number} Timeout ID
     */
    setGameTimeout(callback, delay) {
        const id = setTimeout(callback, delay);
        this.activeTimeouts.push(id);
        return id;
    }

    /**
     * Wrapper for requestAnimationFrame that automatically tracks and cancels the frame
     * @param {Function} callback - Function to execute
     * @returns {number} Animation frame ID
     */
    requestGameAnimationFrame(callback) {
        const id = requestAnimationFrame(callback);
        this.activeAnimationFrames.push(id);
        return id;
    }

    /**
     * Register a resize handler for automatic cleanup
     * @param {Function} handler - Resize handler function
     */
    addResizeHandler(handler) {
        window.addEventListener('resize', handler);
        this.activeResizeHandlers.push(handler);
    }

    /**
     * Safely close an AudioContext
     * @param {AudioContext} audioContext - AudioContext to close
     */
    async closeAudioContext(audioContext) {
        if (audioContext && audioContext.state !== 'closed') {
            try {
                await audioContext.close();
            } catch (e) {
                console.error('Error closing AudioContext:', e);
            }
        }
    }

    /**
     * Get list of assets needed by this game
     * Can be overridden by child classes
     */
    getAssets() {
        return [];
    }

    /**
     * Pause the game
     * Can be overridden by child classes
     */
    pause() {
        // Default: do nothing
    }

    /**
     * Resume the game
     * Can be overridden by child classes
     */
    resume() {
        // Default: do nothing
    }
}
