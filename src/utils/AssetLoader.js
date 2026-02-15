/**
 * Asset Preloader
 * Handles preloading of images and audio files
 */

class AssetLoader {
    constructor() {
        this.loadedAssets = new Map();
        this.loadingPromises = new Map();
    }

    /**
     * Preload an image
     */
    loadImage(src) {
        if (this.loadedAssets.has(src)) {
            return Promise.resolve(this.loadedAssets.get(src));
        }

        if (this.loadingPromises.has(src)) {
            return this.loadingPromises.get(src);
        }

        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.loadedAssets.set(src, img);
                this.loadingPromises.delete(src);
                resolve(img);
            };
            img.onerror = () => {
                this.loadingPromises.delete(src);
                reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
        });

        this.loadingPromises.set(src, promise);
        return promise;
    }

    /**
     * Preload an audio file
     */
    loadAudio(src) {
        if (this.loadedAssets.has(src)) {
            return Promise.resolve(this.loadedAssets.get(src));
        }

        if (this.loadingPromises.has(src)) {
            return this.loadingPromises.get(src);
        }

        const promise = new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => {
                this.loadedAssets.set(src, audio);
                this.loadingPromises.delete(src);
                resolve(audio);
            };
            audio.onerror = () => {
                this.loadingPromises.delete(src);
                reject(new Error(`Failed to load audio: ${src}`));
            };
            audio.src = src;
            audio.load();
        });

        this.loadingPromises.set(src, promise);
        return promise;
    }

    /**
     * Preload multiple assets
     */
    async loadAssets(assets) {
        const promises = assets.map(asset => {
            if (asset.type === 'image') {
                return this.loadImage(asset.src);
            } else if (asset.type === 'audio') {
                return this.loadAudio(asset.src);
            }
            return Promise.resolve();
        });

        return Promise.all(promises);
    }

    /**
     * Get a loaded asset
     */
    getAsset(src) {
        return this.loadedAssets.get(src);
    }

    /**
     * Clear all loaded assets
     */
    clear() {
        this.loadedAssets.clear();
        this.loadingPromises.clear();
    }
}

// Export singleton instance
export default new AssetLoader();
