// ========================================
// CANVAS
// ========================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


// ========================================
// ELEMENTOS HTML
// ========================================

const scoreElement = document.getElementById("score");
const livesElement = document.getElementById("lives");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const winScreen = document.getElementById("winScreen");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const nextButton = document.getElementById("nextButton");

const finalScoreElement = document.getElementById("finalScore");
const winScoreElement = document.getElementById("winScore");


// ========================================
// JOGADOR
// ========================================

const player = {
    width: 120,
    height: 14,

    x: canvas.width / 2 - 60,
    y: canvas.height - 35,

    speed: 7,

    dx: 0
};


// ========================================
// BOLA
// ========================================

const ball = {
    x: canvas.width / 2,
    y: canvas.height - 60,

    radius: 8,

    speed: 5,

    dx: 4,
    dy: -4
};


// ========================================
// BLOCOS
// ========================================

const blocks = [];

const blockConfig = {
    rows: 4,
    columns: 8,

    width: 82,
    height: 25,

    gap: 8,

    startX: 26,
    startY: 40
};


function createBlocks() {

    blocks.length = 0;

    for (let row = 0; row < blockConfig.rows; row++) {

        for (let column = 0; column < blockConfig.columns; column++) {

            const x =
                blockConfig.startX +
                column * (blockConfig.width + blockConfig.gap);

            const y =
                blockConfig.startY +
                row * (blockConfig.height + blockConfig.gap);

            blocks.push({
                x: x,
                y: y,

                width: blockConfig.width,
                height: blockConfig.height,

                destroyed: false
            });
        }
    }
}


// ========================================
// JOGO
// ========================================

let score = 0;
let lives = 3;

let gameRunning = false;

let animationId;


// ========================================
// TECLADO
// ========================================

const keys = {
    left: false,
    right: false
};


document.addEventListener("keydown", (event) => {

    if (
        event.key === "ArrowLeft" ||
        event.key.toLowerCase() === "a"
    ) {
        keys.left = true;
    }

    if (
        event.key === "ArrowRight" ||
        event.key.toLowerCase() === "d"
    ) {
        keys.right = true;
    }
});


document.addEventListener("keyup", (event) => {

    if (
        event.key === "ArrowLeft" ||
        event.key.toLowerCase() === "a"
    ) {
        keys.left = false;
    }

    if (
        event.key === "ArrowRight" ||
        event.key.toLowerCase() === "d"
    ) {
        keys.right = false;
    }
});


// ========================================
// INICIAR JOGO
// ========================================

function startGame() {

    score = 0;
    lives = 3;

    updateScore();
    updateLives();

    resetPlayer();
    resetBall();

    createBlocks();

    gameRunning = true;

    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    winScreen.classList.add("hidden");

    cancelAnimationFrame(animationId);

    gameLoop();
}


// ========================================
// RESET PLAYER
// ========================================

function resetPlayer() {

    player.x =
        canvas.width / 2 -
        player.width / 2;

    player.dx = 0;
}


// ========================================
// RESET BALL
// ========================================

function resetBall() {

    ball.x = canvas.width / 2;

    ball.y =
        canvas.height -
        70;

    ball.dx = 4;

    ball.dy = -4;
}


// ========================================
// MOVIMENTO DO PLAYER
// ========================================

function updatePlayer() {

    if (keys.left) {
        player.x -= player.speed;
    }

    if (keys.right) {
        player.x += player.speed;
    }


    // Parede esquerda

    if (player.x < 0) {
        player.x = 0;
    }


    // Parede direita

    if (
        player.x + player.width >
        canvas.width
    ) {

        player.x =
            canvas.width -
            player.width;
    }
}


// ========================================
// MOVIMENTO DA BOLA
// ========================================

function updateBall() {

    ball.x += ball.dx;
    ball.y += ball.dy;


    // Parede esquerda

    if (
        ball.x - ball.radius <= 0
    ) {

        ball.x = ball.radius;

        ball.dx *= -1;
    }


    // Parede direita

    if (
        ball.x + ball.radius >=
        canvas.width
    ) {

        ball.x =
            canvas.width -
            ball.radius;

        ball.dx *= -1;
    }


    // Parede superior

    if (
        ball.y - ball.radius <= 0
    ) {

        ball.y = ball.radius;

        ball.dy *= -1;
    }


    checkPlayerCollision();

    checkBlockCollision();


    // Bola caiu

    if (
        ball.y - ball.radius >
        canvas.height
    ) {

        loseLife();
    }
}


// ========================================
// COLISÃO COM PLAYER
// ========================================

function checkPlayerCollision() {

    const ballBottom =
        ball.y + ball.radius;

    const playerTop =
        player.y;

    const playerBottom =
        player.y + player.height;

    const ballLeft =
        ball.x - ball.radius;

    const ballRight =
        ball.x + ball.radius;

    const playerLeft =
        player.x;

    const playerRight =
        player.x + player.width;


    const collision =
        ballBottom >= playerTop &&
        ball.y <= playerBottom &&
        ballRight >= playerLeft &&
        ballLeft <= playerRight;


    if (
        collision &&
        ball.dy > 0
    ) {

        ball.y =
            player.y -
            ball.radius;

        ball.dy *= -1;


        // Define o ângulo
        // dependendo do local da barra

        const hitPosition =
            (
                ball.x -
                player.x
            ) /
            player.width;


        const angle =
            (hitPosition - 0.5) * 2;


        ball.dx =
            angle * 6;
    }
}


// ========================================
// COLISÃO COM BLOCOS
// ========================================

function checkBlockCollision() {

    for (const block of blocks) {

        if (block.destroyed) {
            continue;
        }


        const collision =
            ball.x + ball.radius > block.x &&
            ball.x - ball.radius <
                block.x + block.width &&
            ball.y + ball.radius > block.y &&
            ball.y - ball.radius <
                block.y + block.height;


        if (collision) {

            block.destroyed = true;

            ball.dy *= -1;

            score += 10;

            updateScore();

            checkWin();

            break;
        }
    }
}


// ========================================
// PERDER VIDA
// ========================================

function loseLife() {

    lives--;

    updateLives();


    if (lives <= 0) {

        gameOver();

        return;
    }


    resetPlayer();
    resetBall();
}


// ========================================
// VERIFICAR VITÓRIA
// ========================================

function checkWin() {

    const remainingBlocks =
        blocks.some(
            block => !block.destroyed
        );


    if (!remainingBlocks) {

        winGame();
    }
}


// ========================================
// GAME OVER
// ========================================

function gameOver() {

    gameRunning = false;

    finalScoreElement.textContent =
        formatScore(score);

    gameOverScreen.classList.remove(
        "hidden"
    );
}


// ========================================
// VITÓRIA
// ========================================

function winGame() {

    gameRunning = false;

    score += 500;

    updateScore();

    winScoreElement.textContent =
        formatScore(score);

    winScreen.classList.remove(
        "hidden"
    );
}


// ========================================
// ATUALIZAR SCORE
// ========================================

function updateScore() {

    scoreElement.textContent =
        formatScore(score);
}


function formatScore(value) {

    return String(value).padStart(4, "0");
}


// ========================================
// ATUALIZAR VIDAS
// ========================================

function updateLives() {

    livesElement.textContent =
        "♥".repeat(lives);
}


// ========================================
// DESENHAR PLAYER
// ========================================

function drawPlayer() {

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        player.x,
        player.y,
        player.width,
        player.height
    );
}


// ========================================
// DESENHAR BOLA
// ========================================

function drawBall() {

    ctx.beginPath();

    ctx.arc(
        ball.x,
        ball.y,
        ball.radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#ffffff";

    ctx.fill();

    ctx.closePath();
}


// ========================================
// DESENHAR BLOCOS
// ========================================

function drawBlocks() {

    for (const block of blocks) {

        if (block.destroyed) {
            continue;
        }


        ctx.fillStyle = "#ffffff";

        ctx.fillRect(
            block.x,
            block.y,
            block.width,
            block.height
        );
    }
}


// ========================================
// FUNDO
// ========================================

function drawBackground() {

    ctx.fillStyle = "#050505";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
}


// ========================================
// GAME LOOP
// ========================================

function gameLoop() {

    if (!gameRunning) {
        return;
    }


    update();

    draw();


    animationId =
        requestAnimationFrame(gameLoop);
}


// ========================================
// UPDATE
// ========================================

function update() {

    updatePlayer();

    updateBall();
}


// ========================================
// DRAW
// ========================================

function draw() {

    drawBackground();

    drawBlocks();

    drawPlayer();

    drawBall();
}


// ========================================
// BOTÕES
// ========================================

startButton.addEventListener(
    "click",
    startGame
);

restartButton.addEventListener(
    "click",
    startGame
);

nextButton.addEventListener(
    "click",
    startGame
);


// ========================================
// ESTADO INICIAL
// ========================================

createBlocks();

draw();