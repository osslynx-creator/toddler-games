/**
 * Centralized State Store with Pub/Sub pattern
 * Manages global application state and notifies subscribers of changes
 */

class Store {
    constructor() {
        this.state = {
            currentGame: null,
            isMuted: this.loadMuteState(),
            score: 0,
            unlockedLevels: {}
        };

        this.subscribers = new Map();
    }

    /**
     * Get current state (read-only)
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Update state and notify subscribers
     */
    setState(updates) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...updates };

        // Notify subscribers of changed keys
        Object.keys(updates).forEach(key => {
            if (this.subscribers.has(key)) {
                this.subscribers.get(key).forEach(callback => {
                    callback(this.state[key], oldState[key]);
                });
            }
        });

        // Persist certain state changes
        if ('isMuted' in updates) {
            this.saveMuteState(updates.isMuted);
        }
    }

    /**
     * Subscribe to state changes for a specific key
     */
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        this.subscribers.get(key).add(callback);

        // Return unsubscribe function
        return () => {
            this.subscribers.get(key).delete(callback);
        };
    }

    /**
     * Load mute state from localStorage
     */
    loadMuteState() {
        try {
            const saved = localStorage.getItem('toddlerGamesMuted');
            return saved === 'true';
        } catch (e) {
            return false;
        }
    }

    /**
     * Save mute state to localStorage
     */
    saveMuteState(isMuted) {
        try {
            localStorage.setItem('toddlerGamesMuted', isMuted.toString());
        } catch (e) {
            console.error('Failed to save mute state:', e);
        }
    }
}

// Export singleton instance
export default new Store();
