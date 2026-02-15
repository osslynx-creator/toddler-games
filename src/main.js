/**
 * Main Application Entry Point
 * Initializes the app, registers games, and handles navigation
 */

import './css/style.css';
import store from './store/index.js';
import audioManager from './utils/AudioManager.js';
import voiceManager from './utils/VoiceManager.js';
import confettiManager from './utils/ConfettiManager.js';

// Import games
import BalloonPopGame from './games/BalloonPop.js';
import MusicalPianoGame from './games/MusicalPiano.js';
import ColorSorterGame from './games/ColorSorter.js';
import AnimalSoundsGame from './games/AnimalSounds.js';
import ShapeMatchGame from './games/ShapeMatch.js';
import MemoryGame from './games/MemoryGame.js';
import MoleGame from './games/MoleGame.js';
import DrawingPadGame from './games/DrawingPad.js';
import HungryAnimalsGame from './games/HungryAnimals.js';

class App {
    constructor() {
        this.games = new Map();
        this.currentGame = null;
        this.container = null;
        this.menuContainer = null;
    }

    init() {
        // Initialize managers
        audioManager.init();
        voiceManager.init();
        confettiManager.init();

        // Create app structure
        this.createAppStructure();

        // Register games
        this.registerGame(new BalloonPopGame());
        this.registerGame(new MusicalPianoGame());
        this.registerGame(new ColorSorterGame());
        this.registerGame(new AnimalSoundsGame());
        this.registerGame(new ShapeMatchGame());
        this.registerGame(new MemoryGame());
        this.registerGame(new MoleGame());
        this.registerGame(new DrawingPadGame());
        this.registerGame(new HungryAnimalsGame());

        // Setup event listeners
        this.setupEventListeners();

        // Show menu
        this.showMenu();
    }

    createAppStructure() {
        const app = document.getElementById('app');

        app.innerHTML = `
      <div class="menu-screen" id="menuScreen">
        <h1 class="game-title">🎮 Jeux pour Tout-Petits</h1>
        <div class="games-grid" id="gamesGrid"></div>
        <div class="scroll-hint">👆 Tape pour jouer!</div>
      </div>
      
      <div class="game-container hidden" id="gameContainer"></div>
      
      <button class="home-button hidden" id="homeButton">🏠</button>
      <button class="mute-button" id="muteButton">${store.getState().isMuted ? '🔇' : '🔊'}</button>
    `;

        this.menuContainer = document.getElementById('menuScreen');
        this.container = document.getElementById('gameContainer');

        // Subscribe to store changes
        store.subscribe('isMuted', (isMuted) => {
            document.getElementById('muteButton').textContent = isMuted ? '🔇' : '🔊';
        });
    }

    registerGame(game) {
        this.games.set(game.id, game);
        this.addGameCard(game);
    }

    addGameCard(game) {
        const gamesGrid = document.getElementById('gamesGrid');
        const card = document.createElement('button');
        card.className = 'game-card';
        card.dataset.game = game.id;
        card.innerHTML = `<span class="game-icon">${game.icon}</span>`;

        card.addEventListener('click', () => this.startGame(game.id));
        gamesGrid.appendChild(card);
    }

    setupEventListeners() {
        // Home button
        document.getElementById('homeButton').addEventListener('click', () => {
            this.showMenu();
        });

        // Mute button
        document.getElementById('muteButton').addEventListener('click', () => {
            const currentState = store.getState().isMuted;
            store.setState({ isMuted: !currentState });
            audioManager.playPop();
        });

        // Start overlay unlock (if needed)
        document.addEventListener('click', () => {
            voiceManager.unlock();
        }, { once: true });
    }

    startGame(gameId) {
        const game = this.games.get(gameId);
        if (!game) {
            console.error('Game not found:', gameId);
            return;
        }

        // Cleanup current game
        if (this.currentGame) {
            this.currentGame.unmount();
        }

        // Update UI
        window.scrollTo(0, 0);
        this.menuContainer.classList.add('hidden');
        this.container.classList.remove('hidden');
        document.getElementById('homeButton').classList.remove('hidden');
        document.querySelector('.scroll-hint').classList.add('hidden');

        // Mount new game
        this.container.innerHTML = '';
        game.mount(this.container);
        this.currentGame = game;

        // Update store
        store.setState({ currentGame: gameId });

        // Play start sound
        audioManager.playPop();
    }

    showMenu() {
        // Cleanup current game
        if (this.currentGame) {
            this.currentGame.unmount();
            this.currentGame = null;
        }

        // Update UI
        this.menuContainer.classList.remove('hidden');
        this.container.classList.add('hidden');
        this.container.innerHTML = '';
        document.getElementById('homeButton').classList.add('hidden');
        document.querySelector('.scroll-hint').classList.remove('hidden');

        // Update store
        store.setState({ currentGame: null });

        // Play sound
        audioManager.playPop();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('SW registered: ', registration);
            }).catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
        });
    }
});
