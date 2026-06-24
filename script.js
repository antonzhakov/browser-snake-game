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
    function generateRandomDirection() {
        let allDirections = ["left", "right", "up", "down"];

        // find safe directions so that we have place to grow the tail depending on the snakeSize
        let safeDirections = allDirections.filter(function(dir) {
            if (dir === "right") {
                return headCell.x >= snakeSize - 1;
            }

            if (dir === "left") {
                return headCell.x <= boardSize.x - snakeSize;
            }

            if (dir === "up") {
                return headCell.y <= boardSize.y - snakeSize;
            }

            if (dir === "down") {
                return headCell.y >= snakeSize - 1;
            }
        });
        
        // choose random direction from the new safe array
        let randomDirection = safeDirections[Math.floor(Math.random() * safeDirections.length)]
        return randomDirection;
    }

    function generateSnake() {
        let emptyArray = Array.from({ length: snakeSize }); // [undefined, ... , undefined]

        // _ is the element which is currently undefined and index is the index of that element in the array
        let snakeCells = emptyArray.map(function(_, index) {
            if (direction === "left") {
                return { x: headCell.x + index, y: headCell.y };
            }

            if (direction === "right") {
                return { x: headCell.x - index, y: headCell.y };
            }

            if (direction === "up") {
                return { x: headCell.x, y: headCell.y + index };
            }

            if (direction === "down") {
                return { x: headCell.x, y: headCell.y - index };
            }
        });

        return snakeCells;
    }

    if ((boardSize.x < snakeSize) || (boardSize.y < snakeSize)) {
        console.log("SNAKE_TOO_BIG");
        return null;
    }

    let headCell = getRandomCell(boardSize);
    let direction = generateRandomDirection();
    let snake = generateSnake();
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
    function onKeyboardInput() {
        let key = gameEvent.key;
        let newState = {...state};
        newState.directionQueue = [...state.directionQueue];

        let lastDirection = state.directionQueue.length > 0 
            ? state.directionQueue[state.directionQueue.length - 1] 
            : state.direction;


        switch (key) {
            case "Escape":
                newState.isGamePaused = !state.isGamePaused;
                newState.selectedOption = (state.isGameOver) ? 0 : 1;
                break;
            case "Enter":
                if (state.isGamePaused) {
                    switch (state.selectedOption) {
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
                if (state.isGamePaused) {
                    newState.selectedOption = (state.selectedOption + 1) % state.optionsCount;
                } else {
                    if (!((lastDirection === "up") || (lastDirection === "down"))) {
                        newState.directionQueue.push("up");
                    }
                }
                break;
            case "ArrowDown":
                if (state.isGamePaused) {
                    newState.selectedOption = (state.selectedOption - 1 + state.optionsCount) % state.optionsCount;
                } else {
                    if (!((lastDirection === "up") || (lastDirection === "down"))) {
                        newState.directionQueue.push("down");
                    }
                }
                break;
        }

        return newState;
    }

    function onTick() {
        if (state.isGamePaused || state.isGameOver) {
            return state;
        }

        let newState = {...state};
        newState.snake = [...state.snake];
        newState.directionQueue = [...state.directionQueue];

        function getUpdate() {
        // returns object with properties:
        // action: "MOVE"/"GROW"/"DIE", (for all)
        // newHead: {x: X, y: Y}, (for move and grow)
            let currentHead = newState.snake[0];
            let newHead;
            let direction = newState.directionQueue.shift() || state.direction;
            newState.direction = direction;
            
            switch (direction) {
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
            
            if ((newHead.x >= state.boardSize.x) || (newHead.x < 0) ||
                (newHead.y >= state.boardSize.y) || (newHead.y < 0)) {
                return {action: "DIE"};
            } else if (state.snake.some(cell => (cell.x === newHead.x) && (cell.y === newHead.y))) {
                return {action: "DIE"};
            } else {
                if ((newHead.x === state.food.x) && (newHead.y === state.food.y)) {
                    return {action: "GROW", newHead};
                } else {
                    return {action: "MOVE", newHead};
                }
            }
        }

        let update = getUpdate();
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
            return onTick();
            break;
        case "KEYBOARD_INPUT":
            return onKeyboardInput();
            break;
        default:
            console.log("UNKNOWN_EVENT");
            return state;
            break;
    } 
}

function draw(state) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // SNAKE & FOOD
    ctx.fillStyle = "red";
    ctx.fillRect(state.food.x * cellSize,
                 state.food.y * cellSize,
                 cellSize,
                 cellSize);
    
    ctx.fillStyle = "lime";
    state.snake.forEach(function(snakeCell) {
        ctx.fillRect(snakeCell.x * cellSize,
                     snakeCell.y * cellSize,
                     cellSize,
                     cellSize);
    });

    // SCORE
    document.getElementById("score").innerText = "SCORE: " + state.score;

    // MENU
    if (state.isGamePaused) {
        document.getElementById("menu").style.display = "flex"; // show menu
    } else {
        document.getElementById("menu").style.display = "none" // hide menu
    }

    if (state.isGameOver) {
        document.getElementById("menuMessage").innerText = "GAME OVER";
        document.getElementById("resumeOption").style.display = "none" // hide resume
    } else {
        document.getElementById("resumeOption").style.display = "list-item" // show resume
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

function gameTick() {
    currentState = gameReducer(currentState, {type: "TICK"});
    draw(currentState);
}

// get context for drawing
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const cellSize = canvas.width / 16;

// generate the starting state
let currentState = initializeState();

// Event Listeners
const intervalId = setInterval(gameTick, currentState.tickInterval);
document.addEventListener("keydown", function(event) {
    let key = event.key;
    currentState = gameReducer(currentState, {type: "KEYBOARD_INPUT", key});
    draw(currentState);
});