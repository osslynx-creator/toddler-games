# Toddler Games - Educational Web App for Ages 3-4

A tablet-first, responsive web application containing educational mini-games for toddlers.

## Features

- **🐶 Animal Sounds**: Tap animal cards to hear sounds and see animations
- **🔵 Shape Match**: Drag and drop shapes into their matching outlines
- **🎨 Drawing Pad**: Draw with multiple colors on a canvas (supports multi-touch!)

## Design Principles

- **No text**: Uses large emojis and icons
- **Large touch targets**: All interactive elements are minimum 80x80px
- **No failure states**: Gentle feedback for mistakes, celebration for success
- **Bright, high-contrast colors**: Visually appealing for young children
- **Immediate audio feedback**: Procedurally generated sounds (no external files needed)

## File Structure

```
index.html          # Main shell with navigation
css/
  style.css         # All styles with responsive design
js/
  main.js           # App initialization and navigation
  utils/
    audio.js        # Web Audio API sound generation
    confetti.js     # Visual celebration effects
  games/
    animalSounds.js # Animal sounds game logic
    shapeMatch.js   # Drag-and-drop shape matching
    drawingPad.js   # Drawing canvas with colors
```

## How to Use

1. Open `index.html` in any modern web browser
2. Tap any game card to start playing
3. Tap the 🏠 home button to return to the menu

## Technical Details

- **Pure vanilla JavaScript**: No frameworks, lightweight
- **Web Audio API**: Procedurally generates all sounds (barks, meows, pop sounds, etc.)
- **Touch & Mouse support**: Works on tablets, phones, and desktops
- **Multi-touch drawing**: Multiple fingers can draw simultaneously
- **Responsive CSS**: Adapts to different screen sizes

## Browser Compatibility

- Chrome 60+
- Safari 12+
- Firefox 60+
- Edge 79+
- iOS Safari 12+
- Chrome for Android 60+

## Customization

### Adding New Animals

Edit `js/games/animalSounds.js`:
```javascript
animals: [
    { emoji: '🐶', type: 'dog', color: '#FFE4B5' },
    { emoji: '🐱', type: 'cat', color: '#FFB6C1' },
    // Add more here
]
```

Then add the sound in `js/utils/audio.js` in the `playAnimalSound` method.

### Changing Colors

Edit the color arrays in `js/games/drawingPad.js`:
```javascript
colors: [
    { color: '#ff0000', label: 'Red' },
    // Add/modify colors here
]
```

### Adding New Games

1. Create a new file in `js/games/`
2. Implement the game interface:
   - `start(containerElement)`: Render and start the game
   - `cleanup()`: Remove listeners and stop animations
3. Register in `js/main.js`:
```javascript
const games = {
    animalSounds: AnimalSoundsGame,
    yourNewGame: YourNewGame  // Add here
};
```
4. Add a menu button in `index.html`

## Audio

All sounds are generated using the Web Audio API. No external audio files are required!

## License

This project is open source and free to use for educational purposes.
