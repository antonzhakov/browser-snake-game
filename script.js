function getRandomCell(boardSize) {
        let randomX = Math.floor(Math.random() * boardSize.x);
        let randomY = Math.floor(Math.random() * boardSize.y);
        return {x: randomX, y: randomY};
    }

function generateFood(snake, boardSize) {
    let foodCell;
    while (true) {
        foodCell = getRandomCell(boardSize);
        if (!snake.some(cell => (cell.x === foodCell.x) && (cell.y === foodCell.y))) {
            return foodCell;
        }
    }
}

function initializeState(boardSize = {x: 16, y: 16}, snakeSize = 3, tickInterval = 150, optionsCount = 2) {
    function generateRandomDirection(currentHead, currentSize, currentBoard) {
        let allDirections = ["left", "right", "up", "down"];

        // find safe directions so that we have place to grow the tail depending on the snakeSize
        let safeDirections = allDirections.filter(function(dir) {
            if (dir === "right") {
                return currentHead.x >= currentSize - 1;
            }

            if (dir === "left") {
                return currentHead.x <= currentBoard.x - currentSize;
            }

            if (dir === "up") {
                return currentHead.y <= currentBoard.y - currentSize;
            }

            if (dir === "down") {
                return currentHead.y >= currentSize - 1;
            }
        });
        
        // choose random direction from the new safe array
        let randomDirection = safeDirections[Math.floor(Math.random() * safeDirections.length)];
        return randomDirection;
    }

    function generateSnake(startHead, currentDir, totalSize) {
        let emptyArray = Array.from({ length: totalSize }); // [undefined, ... , undefined]

        // _ is the element which is currently undefined and index is the index of that element in the array
        let snakeCells = emptyArray.map(function(_, index) {
            if (currentDir === "left") {
                return { x: startHead.x + index, y: startHead.y };
            }

            if (currentDir === "right") {
                return { x: startHead.x - index, y: startHead.y };
            }

            if (currentDir === "up") {
                return { x: startHead.x, y: startHead.y + index };
            }

            if (currentDir === "down") {
                return { x: startHead.x, y: startHead.y - index };
            }
        });

        return snakeCells;
    }

    if ((boardSize.x < snakeSize) || (boardSize.y < snakeSize)) {
        console.log("SNAKE_TOO_BIG");
        return null;
    }

    let headCell = getRandomCell(boardSize);
    let direction = generateRandomDirection(headCell, snakeSize, boardSize);
    let snake = generateSnake(headCell, direction, snakeSize);
    let food = generateFood(snake, boardSize);

    let currentState = {
        boardSize,
        snake,
        direction,
        directionQueue: [],
        food,
        score: 0,
        isGameOver: false,
        isGamePaused: false,
        tickInterval, // in ms
        selectedOption: 1,
        optionsCount
    };

    return currentState;
}

function gameReducer(state, gameEvent) {
    function onKeyboardInput(currentState, event) {
        let key = event.key;
        let newState = {...currentState};
        newState.directionQueue = [...currentState.directionQueue];

        let lastDirection = currentState.directionQueue.length > 0 
            ? currentState.directionQueue[currentState.directionQueue.length - 1] 
            : currentState.direction;


        switch (key) {
            case "Escape":
                newState.isGamePaused = !currentState.isGamePaused;
                newState.selectedOption = (currentState.isGameOver) ? 0 : 1;
                break;
            case "Enter":
                if (currentState.isGamePaused) {
                    switch (currentState.selectedOption) {
                        case 1: // resume
                            newState.isGamePaused = false;
                            break;
                        case 0: // restart
                            newState = initializeState();
                            break;
                    }
                }
                break;
            case "ArrowLeft":
                if (!((lastDirection === "left") || (lastDirection === "right"))) {
                    newState.directionQueue.push("left");
                }
                break;
            case "ArrowRight":
                if (!((lastDirection === "left") || (lastDirection === "right"))) {
                    newState.directionQueue.push("right");
                }
                break;
            case "ArrowUp":
                if (currentState.isGamePaused) {
                    newState.selectedOption = (currentState.selectedOption + 1) % currentState.optionsCount;
                } else {
                    if (!((lastDirection === "up") || (lastDirection === "down"))) {
                        newState.directionQueue.push("up");
                    }
                }
                break;
            case "ArrowDown":
                if (currentState.isGamePaused) {
                    newState.selectedOption = (currentState.selectedOption - 1 + currentState.optionsCount) % currentState.optionsCount;
                } else {
                    if (!((lastDirection === "up") || (lastDirection === "down"))) {
                        newState.directionQueue.push("down");
                    }
                }
                break;
        }

        return newState;
    }

    function onTick(currentState) {
        if (currentState.isGamePaused || currentState.isGameOver) {
            return currentState;
        }

        let newState = {...currentState};
        newState.snake = [...currentState.snake];
        newState.directionQueue = [...currentState.directionQueue];

        function getUpdate(currentSnake, currentDir, currentBoard, currentFood) {
        // returns object with properties:
        // action: "MOVE"/"GROW"/"DIE", (for all)
        // newHead: {x: X, y: Y}, (for move and grow)
            let currentHead = currentSnake[0];
            let newHead;
            
            switch (currentDir) {
                case "left":
                    newHead = {x: currentHead.x - 1, y: currentHead.y};
                    break;
                case "right":
                    newHead = {x: currentHead.x + 1, y: currentHead.y};
                    break;
                case "up":
                    newHead = {x: currentHead.x, y: currentHead.y - 1};
                    break;
                case "down":
                    newHead = {x: currentHead.x, y: currentHead.y + 1};
                    break;
            }
            
            if ((newHead.x >= currentBoard.x) || (newHead.x < 0) ||
                (newHead.y >= currentBoard.y) || (newHead.y < 0)) {
                return {action: "DIE"};
            } else if (currentSnake.some(cell => (cell.x === newHead.x) && (cell.y === newHead.y))) {
                return {action: "DIE"};
            } else {
                if ((newHead.x === currentFood.x) && (newHead.y === currentFood.y)) {
                    return {action: "GROW", newHead};
                } else {
                    return {action: "MOVE", newHead};
                }
            }
        }

        let direction = newState.directionQueue.shift() || currentState.direction;
        newState.direction = direction;
        let update = getUpdate(newState.snake, direction, currentState.boardSize, currentState.food);
        switch (update.action) {
            case "DIE":
                newState.isGameOver = true;
                newState.isGamePaused = true;
                newState.optionsCount = 1;
                newState.selectedOption = 0;
                break;
            case "MOVE":
                newState.snake.unshift(update.newHead);
                newState.snake.pop();
                break;
            case "GROW":
                newState.snake.unshift(update.newHead);
                newState.score++;
                newState.food = generateFood(newState.snake, newState.boardSize);
                break;
        }
        
        return newState;
    }

    switch (gameEvent.type) {
        case "TICK":
            return onTick(state);
        case "KEYBOARD_INPUT":
            return onKeyboardInput(state, gameEvent);
        default:
            console.log("UNKNOWN_EVENT");
            return state;
    } 
}

function draw(state, context, canvasElement, currentCellSize) {
    context.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // SNAKE & FOOD
    context.fillStyle = "red";
    context.fillRect(state.food.x * currentCellSize,
                 state.food.y * currentCellSize,
                 currentCellSize,
                 currentCellSize);
    
    context.fillStyle = "lime";
    state.snake.forEach(function(snakeCell) {
        context.fillRect(snakeCell.x * currentCellSize,
                     snakeCell.y * currentCellSize,
                     currentCellSize,
                     currentCellSize);
    });

    // SCORE
    document.getElementById("score").innerText = "SCORE: " + state.score;

    // MENU
    if (state.isGamePaused) {
        document.getElementById("menu").style.display = "flex"; // show menu
    } else {
        document.getElementById("menu").style.display = "none"; // hide menu
    }

    if (state.isGameOver) {
        document.getElementById("menuMessage").innerText = "GAME OVER";
        document.getElementById("resumeOption").style.display = "none"; // hide resume
    } else {
        document.getElementById("resumeOption").style.display = "list-item"; // show resume
        document.getElementById("menuMessage").innerText = "PAUSED";
        // resume
        if (state.selectedOption === 1) {
            document.getElementById("resumeOption").style.color = "yellow"; // highlight color
            document.getElementById("resumeOption").innerText = "▶ Resume";
        } else {
            document.getElementById("resumeOption").style.color = "white"; // normal color
            document.getElementById("resumeOption").innerText = "Resume";
        }
    }

    // restart
    if (state.selectedOption === 0) {
        document.getElementById("restartOption").style.color = "yellow"; // highlight color
        document.getElementById("restartOption").innerText = "▶ Restart"; 
    } else {
        document.getElementById("restartOption").style.color = "white"; // normal color
        document.getElementById("restartOption").innerText = "Restart";
    }
}

// get context for drawing
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// generate the starting state
let currentState = initializeState();

const cellSize = canvas.width / currentState.boardSize.x;

function gameTick() {
    currentState = gameReducer(currentState, {type: "TICK"});
    draw(currentState, ctx, canvas, cellSize);
}

// Event Listeners
const intervalId = setInterval(gameTick, currentState.tickInterval);
document.addEventListener("keydown", function(event) {
    let key = event.key;
    currentState = gameReducer(currentState, {type: "KEYBOARD_INPUT", key});
    draw(currentState, ctx, canvas, cellSize);
});