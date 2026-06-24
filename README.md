# Snake Game

A classic Snake game built in Vanilla JavaScript, HTML, and CSS. This was created as a university project for the course Functional Programming at Singidunum University.

## Overview

The project is structured to separate the game logic from the graphics rendering. It keeps track of everything using a single state object.

### A bit about how it works
- **Game Logic**: The `gameReducer` function acts as the core engine. It takes the last-known game state and an event (keyboard input or game tick) and calculates the new state (moving the snake, growing, detecting collisions, etc.). 
- **Input Queue**: Keyboard inputs are stored in a small queue. This ensures that if the player presses two arrow keys very quickly, the inputs are processed one at a tick, preventing the snake from accidentally turning back into itself.
- **Rendering**: The `draw` function is purely responsible for graphics. It takes the current game state and paints the snake, the food onto the `<canvas>` as well as some UI elements by modifying properties of other HTML elements.

## Controls
- **Arrow Keys**: Move the snake
- **Escape**: Pause or unpause the game
- **Enter**: Select an option from the pause menu (Resume / Restart)
