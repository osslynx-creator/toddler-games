/**
 * Main Application
 * Handles navigation, game switching, and global state
 */



/**
 * Create "Tap to Start" overlay to unlock audio
 */
function createStartOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'startOverlay';
    overlay.innerHTML = `
        <div class="start-content">
            <div class="start-icon">🎮</div>
            <h1>Toddler Games</h1>
            <p>Jeux pour enfants</p>
            <button class="start-button" id="startBtn">
                START / DÉMARRER
            </button>
            <div class="start-hint">Tap to enable audio & voice</div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Handle start button click
    const startBtn = document.getElementById('startBtn');
    const unlockAudio = () => {
        // FORCE UNMUTE
        AppState.isMuted = false;
        localStorage.setItem('toddlerGamesMuted', 'false');
        if (muteBtn) muteBtn.innerHTML = '🔊';

        // Initialize and Resume AudioContext (Manager)
        if (window.AudioManager) {
            AudioManager.init();
            AudioManager.setMuted(false);
        }

        // Unlock VoiceManager
        if (window.VoiceManager) {
            VoiceManager.init();
            VoiceManager.setMuted(false);
            VoiceManager.unlock();
        }

        AppState.isAudioInitialized = true;

        // Test speak
        setTimeout(() => {
            if (window.VoiceManager) {
                VoiceManager.speak('Bonjour !');
            }
        }, 500);

        // Hide overlay
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
        }, 500);
    };

    startBtn.addEventListener('click', unlockAudio);
    startBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        unlockAudio();
    });
}

// Game registry
const games = {
    animalSounds: AnimalSoundsGame,
    shapeMatch: ShapeMatchGame,
    drawingPad: DrawingPadGame,
    memoryGame: MemoryGame,
    moleGame: MoleGame,
    balloonPop: BalloonPopGame,
    musicalPiano: MusicalPianoGame,
    colorSorter: ColorSorterGame,
    hungryAnimals: HungryAnimalsGame
};

// Global state
const AppState = {
    currentGame: null,
    isAudioInitialized: false,
    isMuted: localStorage.getItem('toddlerGamesMuted') === 'true',
    homeButtonHoldTimer: null,
    homeButtonProgress: 0
};

// DOM Elements
let mainMenu, gameContainer, homeBtn, muteBtn, errorScreen, backgroundShapes;

/**
 * Create error screen element
 */
function createErrorScreen() {
    const screen = document.createElement('div');
    screen.className = 'error-screen hidden';
    screen.innerHTML = `
        <div class="error-icon">😢</div>
        <div class="error-message">Oops! Something went wrong</div>
        <button class="error-retry-btn" onclick="location.reload()">🔄 Try Again</button>
    `;
    document.body.appendChild(screen);
    return screen;
}

/**
 * Show error screen
 */
function showErrorScreen() {
    if (!errorScreen) {
        errorScreen = createErrorScreen();
    }
    errorScreen.classList.remove('hidden');
}

/**
 * Create floating background shapes
 */
function createBackgroundShapes() {
    const shapes = document.createElement('div');
    shapes.className = 'background-shapes';

    // Create SVG shapes - clouds, stars, bubbles
    const shapeTypes = ['cloud', 'star', 'bubble'];
    const colors = ['rgba(255,255,255,0.3)', 'rgba(255,255,200,0.4)', 'rgba(200,230,255,0.3)'];

    for (let i = 0; i < 8; i++) {
        const shape = document.createElement('div');
        shape.className = `bg-shape ${shapeTypes[i % 3]}`;
        shape.style.left = `${Math.random() * 100}%`;
        shape.style.top = `${Math.random() * 100}%`;
        shape.style.animationDelay = `${Math.random() * 20}s`;
        shape.style.animationDuration = `${15 + Math.random() * 20}s`;
        shapes.appendChild(shape);
    }

    document.body.insertBefore(shapes, document.body.firstChild);
    return shapes;
}

/**
 * Create mute button
 */
function createMuteButton() {
    const btn = document.createElement('button');
    btn.id = 'muteBtn';
    btn.className = 'mute-button';
    btn.setAttribute('aria-label', 'Toggle sound');
    btn.innerHTML = AppState.isMuted ? '🔇' : '🔊';

    btn.addEventListener('click', toggleMute);
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        toggleMute();
    });

    document.body.appendChild(btn);
    return btn;
}

/**
 * Create a manual text-to-speech tester
 */
function createVoiceTester() {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.bottom = '150px';
    container.style.left = '10px';
    container.style.zIndex = '9999';
    container.style.background = 'rgba(0,0,0,0.8)';
    container.style.padding = '10px';
    container.style.borderRadius = '8px';

    container.innerHTML = `
        <input type="text" id="ttsInput" value="Test" style="width:80px;margin-right:5px;">
        <button id="ttsBtn" style="padding:5px;">🗣️</button>
    `;

    document.body.appendChild(container);

    document.getElementById('ttsBtn').addEventListener('click', () => {
        const text = document.getElementById('ttsInput').value;
        logToScreen(`Manual Speak: "${text}"`);
        if (window.VoiceManager) {
            VoiceManager.speak(text);
        }
    });
}

/**
 * Create voice test button
 */
function createVoiceTestButton() {
    const btn = document.createElement('button');
    btn.id = 'voiceTestBtn';
    btn.className = 'voice-test-button';
    btn.setAttribute('aria-label', 'Test voice');
    btn.innerHTML = '🗣️';
    btn.title = 'Test Voice';

    const testVoiceHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Main: Voice test button clicked');

        if (window.VoiceManager) {
            // Temporarily unmute for test
            VoiceManager.testVoice();
        } else {
            console.error('Main: VoiceManager not available');
        }
    };

    btn.addEventListener('click', testVoiceHandler);
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        testVoiceHandler(e);
    });

    document.body.appendChild(btn);
    return btn;
}

/**
 * Toggle mute state
 */
function toggleMute() {
    AppState.isMuted = !AppState.isMuted;
    localStorage.setItem('toddlerGamesMuted', AppState.isMuted);

    if (muteBtn) {
        muteBtn.innerHTML = AppState.isMuted ? '🔇' : '🔊';
    }

    // Update AudioManager
    if (window.AudioManager) {
        AudioManager.setMuted(AppState.isMuted);
    }

    // Update VoiceManager
    if (window.VoiceManager) {
        VoiceManager.setMuted(AppState.isMuted);
    }

    // Play feedback sound if unmuting
    if (!AppState.isMuted && window.AudioManager) {
        AudioManager.playPop();
    }
}

/**
 * Setup hold-to-exit for home button
 */
function setupHoldToExit() {
    const holdDuration = 2000; // 2 seconds
    const updateInterval = 50; // Update every 50ms
    let progress = 0;
    let holdInterval = null;
    let isHolding = false;
    let holdStartTime = 0;

    const startHold = (e) => {
        e.preventDefault();
        if (isHolding) return;

        isHolding = true;
        holdStartTime = Date.now();
        progress = 0;
        homeBtn.classList.add('holding');

        holdInterval = setInterval(() => {
            progress += (updateInterval / holdDuration) * 100;
            homeBtn.style.setProperty('--hold-progress', `${progress}%`);

            if (progress >= 100) {
                clearInterval(holdInterval);
                homeBtn.classList.remove('holding');
                homeBtn.style.setProperty('--hold-progress', '0%');
                isHolding = false;
                showMainMenu();
            }
        }, updateInterval);
    };

    const endHold = (e) => {
        if (!isHolding) return;

        const holdTime = Date.now() - holdStartTime;
        isHolding = false;
        clearInterval(holdInterval);
        homeBtn.classList.remove('holding');
        homeBtn.style.setProperty('--hold-progress', '0%');
        progress = 0;

        // If held for less than 500ms, treat as a quick click
        if (holdTime < 500) {
            showMainMenu();
        }
    };

    // Mouse events
    homeBtn.addEventListener('mousedown', startHold);
    homeBtn.addEventListener('mouseup', endHold);
    homeBtn.addEventListener('mouseleave', endHold);

    // Touch events
    homeBtn.addEventListener('touchstart', startHold, { passive: false });
    homeBtn.addEventListener('touchend', endHold);
    homeBtn.addEventListener('touchcancel', endHold);
}

/**
 * Create magic touch particles
 */
function createMagicTouchParticles() {
    const particleColors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff9ff3', '#54a0ff', '#5f27cd'];

    const spawnParticles = (x, y) => {
        const particleCount = 3 + Math.floor(Math.random() * 3); // 3-5 particles

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'magic-particle';
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.backgroundColor = particleColors[Math.floor(Math.random() * particleColors.length)];
            particle.style.transform = `rotate(${Math.random() * 360}deg)`;

            document.body.appendChild(particle);

            // Animate and remove
            setTimeout(() => {
                particle.style.opacity = '0';
                particle.style.transform = `translate(${(Math.random() - 0.5) * 100}px, ${(Math.random() - 0.5) * 100}px) rotate(${Math.random() * 360}deg) scale(0)`;
            }, 10);

            setTimeout(() => {
                particle.remove();
            }, 600);
        }
    };

    // Add listeners to document for global touch/click
    document.addEventListener('click', (e) => {
        // Don't spawn particles on interactive elements
        if (e.target.closest('.game-card') ||
            e.target.closest('.home-button') ||
            e.target.closest('.mute-button') ||
            e.target.closest('.animal-card') ||
            e.target.closest('.memory-card') ||
            e.target.closest('.mole-character') ||
            e.target.closest('.draggable-shape') ||
            e.target.closest('.color-btn') ||
            e.target.closest('.clear-btn') ||
            e.target.closest('canvas')) {
            return;
        }
        spawnParticles(e.clientX, e.clientY);
    });

    document.addEventListener('touchstart', (e) => {
        // Don't spawn particles on interactive elements
        if (e.target.closest('.game-card') ||
            e.target.closest('.home-button') ||
            e.target.closest('.mute-button') ||
            e.target.closest('.animal-card') ||
            e.target.closest('.memory-card') ||
            e.target.closest('.mole-character') ||
            e.target.closest('.draggable-shape') ||
            e.target.closest('.color-btn') ||
            e.target.closest('.clear-btn') ||
            e.target.closest('canvas')) {
            return;
        }

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            spawnParticles(touch.clientX, touch.clientY);
        }
    }, { passive: true });
}

/**
 * Initialize the application
 */
function init() {
    // Setup global error handler
    setupErrorHandling();

    // Cache DOM elements
    mainMenu = document.getElementById('mainMenu');
    gameContainer = document.getElementById('gameContainer');
    homeBtn = document.getElementById('homeBtn');

    // Create "Tap to Start" overlay (blocks interaction until audio is unlocked)
    createStartOverlay();

    // Create UI elements (but don't show main menu yet)
    muteBtn = createMuteButton();
    backgroundShapes = createBackgroundShapes();

    // Setup event listeners
    setupEventListeners();
    setupHoldToExit();
    createMagicTouchParticles();

    // Initialize confetti
    ConfettiManager.init();
}

/**
 * Setup global error handling
 */
function setupErrorHandling() {
    // Catch global errors
    window.onerror = function (message, source, lineno, colno, error) {
        console.error('Global error:', message, error);
        // Only show error screen for critical errors, not game logic errors
        const isCriticalError = !source || source.includes('main.js') || source.includes('index.html');
        if (isCriticalError) {
            showErrorScreen();
        }
        return true;
    };

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', function (event) {
        console.error('Unhandled promise rejection:', event.reason);
        // Only show error screen for critical promise rejections
        const reason = String(event.reason);
        const isCritical = reason.includes('main.js') || reason.includes('index.html') || reason.includes('null') || reason.includes('undefined');
        if (isCritical) {
            showErrorScreen();
        }
        event.preventDefault();
    });

    // Safety wrapper for game functions
    Object.keys(games).forEach(gameKey => {
        const game = games[gameKey];
        const originalStart = game.start.bind(game);
        game.start = function (container) {
            try {
                originalStart(container);
            } catch (error) {
                console.error(`Error starting ${gameKey}:`, error);
                showErrorScreen();
            }
        };
    });
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Game card clicks - use multiple event types for maximum compatibility
    document.querySelectorAll('.game-card').forEach(card => {
        let isPressed = false;
        
        const gameCardHandler = (e) => {
            // Prevent double-firing
            if (isPressed) return;
            isPressed = true;
            
            const gameName = card.dataset.game;
            // Debug logging removed('Card: ' + gameName + ' (' + e.type + ')');
            
            // Check if game exists before starting
            if (!games[gameName]) {
                // Debug logging removed('ERROR: ' + gameName + ' not found');
                alert('Game "' + gameName + '" not loaded. Check debug info below.');
                isPressed = false;
                return;
            }
            
            startGame(gameName);
            
            // Reset after a short delay
            setTimeout(() => {
                isPressed = false;
            }, 300);
        };
        
        // Use click for desktop and touchstart for mobile
        card.addEventListener('click', gameCardHandler);
        
        // For mobile debugging
        card.addEventListener('touchstart', (e) => {
            // Debug logging removed('Touch: ' + card.dataset.game);
        }, { passive: true });
    });

    // Initialize audio on first user interaction
    const initAudio = () => {
        console.log('Main: Initializing audio on user interaction...');

        if (!AppState.isAudioInitialized) {
            // Initialize AudioManager
            AudioManager.init();
            AudioManager.setMuted(AppState.isMuted);

            // Initialize VoiceManager (must be done on user gesture for autoplay policy)
            if (window.VoiceManager) {
                console.log('Main: Initializing VoiceManager on user interaction');
                VoiceManager.init();
                VoiceManager.setMuted(AppState.isMuted);
            }

            AppState.isAudioInitialized = true;
            console.log('Main: Audio initialized successfully');
        }
    };

    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });
}

/**
 * Start a game
 */
function startGame(gameName) {
    // Debug logging removed('Start: ' + gameName);
    
    const game = games[gameName];
    if (!game) {
        // Debug logging removed('ERROR: ' + gameName + ' not in registry');
        return;
    }
    
    if (!game.start || typeof game.start !== 'function') {
        // Debug logging removed('ERROR: ' + gameName + ' no start method');
        return;
    }

    try {
        // Cleanup current game if any
        if (AppState.currentGame && typeof AppState.currentGame.cleanup === 'function') {
            AppState.currentGame.cleanup();
        }

        // Scroll to top for clean game view
        window.scrollTo(0, 0);

        // Hide menu, show game
        mainMenu.classList.add('hidden');
        gameContainer.classList.remove('hidden');

        // Hide scroll hint in game view
        const scrollHint = document.querySelector('.scroll-hint');
        if (scrollHint) {
            scrollHint.classList.add('hidden');
        }

        // Start the game
        game.start(gameContainer);
        AppState.currentGame = game;
        // Debug logging removed('SUCCESS: ' + gameName + ' started');

        // Play transition sound
        if (!AppState.isMuted) {
            AudioManager.playPop();
        }
    } catch (error) {
        // Debug logging removed('ERROR starting ' + gameName + ': ' + error.message);
        showMainMenu();
    }
}

/**
 * Show the main menu
 */
function showMainMenu() {
    // Cleanup current game
    if (AppState.currentGame && typeof AppState.currentGame.cleanup === 'function') {
        AppState.currentGame.cleanup();
        AppState.currentGame = null;
    }

    // Show menu, hide game
    mainMenu.classList.remove('hidden');
    gameContainer.classList.add('hidden');
    gameContainer.innerHTML = '';

    // Show scroll hint in menu view
    const scrollHint = document.querySelector('.scroll-hint');
    if (scrollHint) {
        scrollHint.classList.remove('hidden');
    }

    // Play transition sound
    if (!AppState.isMuted) {
        AudioManager.playPop();
    }
}

/**
 * Handle touch events - allow scrolling but prevent interference with game interactions
 */
document.addEventListener('touchmove', (e) => {
    // Allow scrolling by default on menu screen
    if (mainMenu && !mainMenu.classList.contains('hidden')) {
        return; // Allow scrolling on menu
    }
    
    // Only prevent default for specific draggable game elements when in game
    if (e.target.closest('.draggable-shape') ||
        e.target.closest('#drawingCanvas') ||
        e.target.closest('.balloon') ||
        e.target.closest('.piano-key') ||
        e.target.closest('.sorter-ball')) {
        // Prevent scrolling while dragging or drawing
        e.preventDefault();
    }
}, { passive: false });

/**
 * Prevent zoom on double tap
 */
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

/**
 * Prevent context menu on long press
 */
document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.game-card') ||
        e.target.closest('.animal-card') ||
        e.target.closest('.draggable-shape') ||
        e.target.closest('.color-btn') ||
        e.target.closest('.balloon') ||
        e.target.closest('.piano-key') ||
        e.target.closest('.sorter-ball')) {
        e.preventDefault();
    }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Debug logging removed('DOM loaded');
    
    // Check if all game objects exist
    const gameChecks = {
        animalSounds: typeof AnimalSoundsGame !== 'undefined',
        shapeMatch: typeof ShapeMatchGame !== 'undefined',
        drawingPad: typeof DrawingPadGame !== 'undefined',
        memoryGame: typeof MemoryGame !== 'undefined',
        moleGame: typeof MoleGame !== 'undefined',
        balloonPop: typeof BalloonPopGame !== 'undefined',
        musicalPiano: typeof MusicalPianoGame !== 'undefined',
        colorSorter: typeof ColorSorterGame !== 'undefined'
    };
    
    // Debug logging removed('Games loaded: ' + JSON.stringify(gameChecks));
    
    // Only add games that exist to the registry
    const availableGames = {};
    if (gameChecks.animalSounds) availableGames.animalSounds = AnimalSoundsGame;
    if (gameChecks.shapeMatch) availableGames.shapeMatch = ShapeMatchGame;
    if (gameChecks.drawingPad) availableGames.drawingPad = DrawingPadGame;
    if (gameChecks.memoryGame) availableGames.memoryGame = MemoryGame;
    if (gameChecks.moleGame) availableGames.moleGame = MoleGame;
    if (gameChecks.balloonPop) availableGames.balloonPop = BalloonPopGame;
    if (gameChecks.musicalPiano) availableGames.musicalPiano = MusicalPianoGame;
    if (gameChecks.colorSorter) availableGames.colorSorter = ColorSorterGame;
    
    // Update games registry with only available games
    Object.assign(games, availableGames);
    
    // Debug logging removed('Registry: ' + Object.keys(games).join(', '));
    init();
});

// Expose for debugging
window.ToddlerGames = {
    state: AppState,
    games,
    showMainMenu,
    startGame,
    toggleMute
};
