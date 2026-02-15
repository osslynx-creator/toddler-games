/**
 * Labyrinth Game - ES Module
 * Help the animal find its food by navigating through the maze
 * Features: Grid-based movement, path tracing, friendly wall interactions
 */

import Game from './Game.js';
import audioManager from '../utils/AudioManager.js';
import voiceManager from '../utils/VoiceManager.js';
import confettiManager from '../utils/ConfettiManager.js';

export default class LabyrinthGame extends Game {
    constructor() {
        super({
            id: 'labyrinthGame',
            name: 'Labyrinth Game',
            icon: '🐱'
        });

        this.currentLevel = 1;
        this.maxLevel = 3;
        this.gridSize = 3; // Will be set per level
        this.playerPos = { x: 0, y: 0 };
        this.goalPos = { x: 0, y: 0 };
        this.isDragging = false;
        this.pathCells = []; // Cells that form the valid path
        this.visitedCells = []; // Cells the player has visited
        this.helpTimeout = null;
        this.maze = []; // 2D array: 0 = wall, 1 = path
        
        // Characters for each level
        this.levels = [
            { 
                animal: '🐱', 
                food: '🐟', 
                foodName: 'poisson',
                animalName: 'chat',
                gridSize: 3,
                message: "Aide le chat à trouver son poisson !"
            },
            { 
                animal: '🐻', 
                food: '🍯', 
                foodName: 'miel',
                animalName: 'ours',
                gridSize: 4,
                message: "L'ours veut son miel !"
            },
            { 
                animal: '🐰', 
                food: '🥕', 
                foodName: 'carotte',
                animalName: 'lapin',
                gridSize: 5,
                message: "Le lapin cherche une carotte !"
            }
        ];
    }

    mount(container) {
        super.mount(container);
        this.container.innerHTML = '';
        this.visitedCells = [];
        this.isDragging = false;
        
        const level = this.levels[this.currentLevel - 1];
        this.gridSize = level.gridSize;
        
        // Generate maze for current level
        this.generateMaze();
        
        // Create game structure
        const wrapper = document.createElement('div');
        wrapper.className = 'maze-wrapper';
        
        // Header with instructions
        const header = this.createHeader(level);
        wrapper.appendChild(header);
        
        // Create maze grid
        const mazeContainer = this.createMazeGrid(level);
        wrapper.appendChild(mazeContainer);
        
        this.container.appendChild(wrapper);
        
        // Position player at start
        this.updatePlayerPosition();
        
        // Start help timer
        this.startHelpTimer();
        
        // Play start sound and voice
        audioManager.playPop();
        voiceManager.speak(level.message);
    }
    
    generateMaze() {
        const size = this.gridSize;
        this.maze = Array(size).fill(null).map(() => Array(size).fill(0));
        this.pathCells = [];
        
        // Generate a guaranteed path from top-left to bottom-right
        // Start position
        this.playerPos = { x: 0, y: 0 };
        this.maze[0][0] = 1;
        this.pathCells.push({ x: 0, y: 0 });
        
        let currentX = 0;
        let currentY = 0;
        
        // For Level 1: Simple curved path with no dead ends
        if (this.currentLevel === 1) {
            // Path: (0,0) -> (1,0) -> (2,0) -> (2,1) -> (2,2)
            const path = [
                { x: 1, y: 0 }, { x: 2, y: 0 },
                { x: 2, y: 1 }, { x: 2, y: 2 }
            ];
            path.forEach(pos => {
                this.maze[pos.y][pos.x] = 1;
                this.pathCells.push(pos);
            });
            this.goalPos = { x: 2, y: 2 };
        } else {
            // For levels 2 & 3: Create winding path using random walk
            while (currentX < size - 1 || currentY < size - 1) {
                const possibleMoves = [];
                
                // Can move right?
                if (currentX < size - 1) {
                    possibleMoves.push({ x: currentX + 1, y: currentY });
                }
                // Can move down?
                if (currentY < size - 1) {
                    possibleMoves.push({ x: currentX, y: currentY + 1 });
                }
                // Can move up? (not for level 1 to keep it simple)
                if (currentY > 0 && this.currentLevel > 1) {
                    possibleMoves.push({ x: currentX, y: currentY - 1 });
                }
                // Can move left?
                if (currentX > 0 && this.currentLevel > 1) {
                    possibleMoves.push({ x: currentX - 1, y: currentY });
                }
                
                // Prefer moving toward goal
                const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                
                if (move) {
                    currentX = move.x;
                    currentY = move.y;
                    this.maze[currentY][currentX] = 1;
                    
                    // Add to path if not already there
                    if (!this.pathCells.some(p => p.x === currentX && p.y === currentY)) {
                        this.pathCells.push({ x: currentX, y: currentY });
                    }
                }
            }
            
            this.goalPos = { x: currentX, y: currentY };
        }
        
        // Add some additional path cells for levels 2 & 3 to make it interesting
        if (this.currentLevel > 1) {
            for (let i = 0; i < size * size * 0.3; i++) {
                const x = Math.floor(Math.random() * size);
                const y = Math.floor(Math.random() * size);
                if (this.maze[y][x] === 0) {
                    this.maze[y][x] = 1;
                    this.pathCells.push({ x, y });
                }
            }
        }
    }
    
    createHeader(level) {
        const header = document.createElement('div');
        header.className = 'maze-header';
        
        const levelInfo = document.createElement('div');
        levelInfo.className = 'maze-level-info';
        levelInfo.innerHTML = `
            <div class="maze-level-number">Niveau ${this.currentLevel}</div>
            <div class="maze-instruction">${level.message}</div>
        `;
        
        const goalPreview = document.createElement('div');
        goalPreview.className = 'maze-goal-preview';
        goalPreview.innerHTML = `
            <span class="maze-animal-preview">${level.animal}</span>
            <span class="maze-arrow">➡️</span>
            <span class="maze-food-preview">${level.food}</span>
        `;
        
        header.appendChild(levelInfo);
        header.appendChild(goalPreview);
        
        return header;
    }
    
    createMazeGrid(level) {
        const container = document.createElement('div');
        container.className = 'maze-container';
        
        // Calculate cell size based on grid size
        const cellSize = this.gridSize === 3 ? 100 : this.gridSize === 4 ? 80 : 65;
        
        const grid = document.createElement('div');
        grid.className = 'maze-grid';
        grid.style.gridTemplateColumns = `repeat(${this.gridSize}, ${cellSize}px)`;
        grid.style.gridTemplateRows = `repeat(${this.gridSize}, ${cellSize}px)`;
        
        // Create cells
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'maze-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.style.width = `${cellSize}px`;
                cell.style.height = `${cellSize}px`;
                
                if (this.maze[y][x] === 1) {
                    cell.classList.add('maze-path');
                    
                    // Add trail element (hidden initially)
                    const trail = document.createElement('div');
                    trail.className = 'maze-trail';
                    cell.appendChild(trail);
                } else {
                    cell.classList.add('maze-wall');
                }
                
                // Add goal
                if (x === this.goalPos.x && y === this.goalPos.y) {
                    const goal = document.createElement('div');
                    goal.className = 'maze-goal';
                    goal.textContent = level.food;
                    cell.appendChild(goal);
                }
                
                grid.appendChild(cell);
            }
        }
        
        // Create player
        const player = document.createElement('div');
        player.className = 'maze-player';
        player.textContent = level.animal;
        player.id = 'mazePlayer';
        grid.appendChild(player);
        
        // Add touch/mouse handlers
        this.addInteractionHandlers(grid);
        
        container.appendChild(grid);
        return container;
    }
    
    addInteractionHandlers(grid) {
        const handleStart = (e) => {
            if (!this.isMounted) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            
            // Check if touching the player
            if (element && (element.classList.contains('maze-player') || element.closest('.maze-player'))) {
                this.isDragging = true;
                this.resetHelpTimer();
            }
        };
        
        const handleMove = (e) => {
            if (!this.isMounted || !this.isDragging) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            
            if (element && element.classList.contains('maze-cell')) {
                const x = parseInt(element.dataset.x);
                const y = parseInt(element.dataset.y);
                
                // Check if adjacent to current position
                const dx = Math.abs(x - this.playerPos.x);
                const dy = Math.abs(y - this.playerPos.y);
                
                if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
                    this.attemptMove(x, y);
                }
            }
        };
        
        const handleEnd = () => {
            this.isDragging = false;
        };
        
        this.addEventListener(grid, 'mousedown', handleStart);
        this.addEventListener(grid, 'touchstart', handleStart, { passive: false });
        this.addEventListener(document, 'mousemove', handleMove);
        this.addEventListener(document, 'touchmove', handleMove, { passive: false });
        this.addEventListener(document, 'mouseup', handleEnd);
        this.addEventListener(document, 'touchend', handleEnd);
    }
    
    attemptMove(x, y) {
        // Check if it's a valid path cell
        if (this.maze[y][x] === 1) {
            // Valid move
            this.playerPos = { x, y };
            this.updatePlayerPosition();
            this.markVisited(x, y);
            audioManager.playPop();
            
            // Check if reached goal
            if (x === this.goalPos.x && y === this.goalPos.y) {
                this.handleWin();
            }
        } else {
            // Hit a wall
            this.handleWallHit(x, y);
        }
    }
    
    updatePlayerPosition() {
        const player = document.getElementById('mazePlayer');
        if (!player) return;
        
        const cellSize = this.gridSize === 3 ? 100 : this.gridSize === 4 ? 80 : 65;
        const padding = 8; // Border padding
        
        player.style.left = `${this.playerPos.x * cellSize + padding}px`;
        player.style.top = `${this.playerPos.y * cellSize + padding}px`;
    }
    
    markVisited(x, y) {
        // Check if already visited
        if (this.visitedCells.some(v => v.x === x && v.y === y)) return;
        
        this.visitedCells.push({ x, y });
        
        // Show trail
        const cell = document.querySelector(`.maze-cell[data-x="${x}"][data-y="${y}"]`);
        if (cell) {
            const trail = cell.querySelector('.maze-trail');
            if (trail) {
                trail.style.opacity = '1';
                trail.style.transform = 'scale(1)';
            }
        }
    }
    
    handleWallHit(x, y) {
        audioManager.playThud();
        
        // Shake the wall
        const cell = document.querySelector(`.maze-cell[data-x="${x}"][data-y="${y}"]`);
        if (cell) {
            cell.classList.add('maze-wall-shake');
            this.setGameTimeout(() => {
                if (cell.parentNode) {
                    cell.classList.remove('maze-wall-shake');
                }
            }, 300);
        }
        
        // Boing the player back slightly
        const player = document.getElementById('mazePlayer');
        if (player) {
            player.classList.add('maze-player-boing');
            this.setGameTimeout(() => {
                if (player.parentNode) {
                    player.classList.remove('maze-player-boing');
                }
            }, 300);
        }
        
        voiceManager.speak('Oh ! C\'est un mur !');
    }
    
    handleWin() {
        const level = this.levels[this.currentLevel - 1];
        
        audioManager.playSuccess();
        voiceManager.speak(`Miam ! Le ${level.animalName} a trouvé son ${level.foodName} !`);
        confettiManager.burstCenter();
        
        // Clear help timer
        this.clearHelpTimer();
        
        // Show celebration
        const celebration = document.createElement('div');
        celebration.className = 'maze-celebration';
        celebration.innerHTML = `
            <div class="maze-celebration-animal">${level.animal}</div>
            <div class="maze-celebration-food">${level.food}</div>
            <div class="maze-celebration-text">Délicieux !</div>
        `;
        this.container.appendChild(celebration);
        
        // Next level
        this.setGameTimeout(() => {
            if (this.isMounted) {
                if (this.currentLevel < this.maxLevel) {
                    this.currentLevel++;
                } else {
                    this.currentLevel = 1;
                }
                this.mount(this.container);
            }
        }, 3500);
    }
    
    startHelpTimer() {
        this.helpTimeout = this.setGameTimeout(() => {
            if (this.isMounted) {
                const level = this.levels[this.currentLevel - 1];
                voiceManager.speak(`Aide le ${level.animalName} à trouver son ${level.foodName} !`);
                this.startHelpTimer(); // Restart timer
            }
        }, 10000);
    }
    
    resetHelpTimer() {
        this.clearHelpTimer();
        this.startHelpTimer();
    }
    
    clearHelpTimer() {
        if (this.helpTimeout) {
            clearTimeout(this.helpTimeout);
            this.helpTimeout = null;
        }
    }
    
    unmount() {
        this.clearHelpTimer();
        this.isDragging = false;
        this.visitedCells = [];
        super.unmount();
    }
}
