
```javascript
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
    normalWidth: 120,
    expandedWidth: 190,

    height: 14,

    x: canvas.width / 2 - 60,
    y: canvas.height - 35,

    speed: 7,

    dx: 0
};


// ========================================
// CONFIGURAÇÃO DA BOLA
// ========================================

const ballConfig = {
    initialSpeed: 5,
    maxSpeed: 8,
    minimumHorizontalSpeed: 1.8,
    maximumHorizontalSpeed: 7.2
};


// ========================================
// BOLAS
// ========================================

const balls = [];


// ========================================
// CONFIGURAÇÃO DOS BLOCOS
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


// ========================================
// POWER-UPS
// ========================================

const powerUps = [];

const powerUpTypes = {
    EXPAND: "expand",
    MULTIBALL: "multiball",
    SLOW: "slow"
};


// ========================================
// ESTADO DOS POWER-UPS
// ========================================

const powerUpState = {
    expandActive: false,
    expandTimer: null,

    slowActive: false,
    slowTimer: null
};


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
// CRIAR BLOCOS
// ========================================

function createBlocks() {

    blocks.length = 0;

    for (let row = 0; row < blockConfig.rows; row++) {

        for (
            let column = 0;
            column < blockConfig.columns;
            column++
        ) {

            const x =
                blockConfig.startX +
                column *
                (blockConfig.width + blockConfig.gap);

            const y =
                blockConfig.startY +
                row *
                (blockConfig.height + blockConfig.gap);


            /*
             * Aproximadamente 25% dos blocos
             * terão chance de gerar um power-up.
             */

            const hasPowerUp =
                Math.random() < 0.25;


            let powerUpType = null;


            if (hasPowerUp) {

                const types = [
                    powerUpTypes.EXPAND,
                    powerUpTypes.MULTIBALL,
                    powerUpTypes.SLOW
                ];

                powerUpType =
                    types[
                        Math.floor(
                            Math.random() * types.length
                        )
                    ];
            }


            blocks.push({

                x: x,
                y: y,

                width: blockConfig.width,
                height: blockConfig.height,

                destroyed: false,

                powerUpType: powerUpType
            });
        }
    }
}


// ========================================
// CRIAR BOLA
// ========================================

function createBall(
    x,
    y,
    speed = ballConfig.initialSpeed,
    angle = null,
    direction = null
) {

    /*
     * Se nenhum ângulo for informado,
     * cria uma direção aleatória.
     */

    if (angle === null) {

        /*
         * Ângulo entre 35° e 145°.
         *
         * Isso evita que a bola comece
         * quase horizontal.
         */

        angle =
            (Math.random() * 110 + 35) *
            (Math.PI / 180);
    }


    if (direction === null) {

        direction =
            Math.random() < 0.5
                ? -1
                : 1;
    }


    const dx =
        Math.cos(angle) *
        speed *
        direction;


    const dy =
        -Math.sin(angle) *
        speed;


    return {

        x: x,
        y: y,

        radius: 8,

        speed: speed,

        dx: dx,
        dy: dy,

        active: true
    };
}


// ========================================
// RESETAR BOLA
// ========================================

function resetBall() {

    balls.length = 0;

    const ball = createBall(
        canvas.width / 2,
        canvas.height - 70
    );

    balls.push(ball);
}


// ========================================
// RESETAR PLAYER
// ========================================

function resetPlayer() {

    player.width = player.normalWidth;

    player.x =
        canvas.width / 2 -
        player.width / 2;

    player.dx = 0;
}


// ========================================
// RESETAR POWER-UPS
// ========================================

function resetPowerUps() {

    powerUps.length = 0;


    clearTimeout(
        powerUpState.expandTimer
    );

    clearTimeout(
        powerUpState.slowTimer
    );


    powerUpState.expandActive = false;
    powerUpState.slowActive = false;


    player.width =
        player.normalWidth;
}


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
    resetPowerUps();


    createBlocks();


    gameRunning = true;


    startScreen.classList.add(
        "hidden"
    );

    gameOverScreen.classList.add(
        "hidden"
    );

    winScreen.classList.add(
        "hidden"
    );


    cancelAnimationFrame(
        animationId
    );


    gameLoop();
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


    /*
     * Parede esquerda
     */

    if (player.x < 0) {

        player.x = 0;
    }


    /*
     * Parede direita
     */

    if (
        player.x +
        player.width >
        canvas.width
    ) {

        player.x =
            canvas.width -
            player.width;
    }
}


// ========================================
// MOVIMENTO DAS BOLAS
// ========================================

function updateBalls() {

    for (const ball of balls) {

        if (!ball.active) {
            continue;
        }


        ball.x += ball.dx;
        ball.y += ball.dy;


        /*
         * Parede esquerda
         */

        if (
            ball.x -
            ball.radius <= 0
        ) {

            ball.x =
                ball.radius;

            ball.dx =
                Math.abs(ball.dx);
        }


        /*
         * Parede direita
         */

        if (
            ball.x +
            ball.radius >=
            canvas.width
        ) {

            ball.x =
                canvas.width -
                ball.radius;

            ball.dx =
                -Math.abs(ball.dx);
        }


        /*
         * Parede superior
         */

        if (
            ball.y -
            ball.radius <= 0
        ) {

            ball.y =
                ball.radius;

            ball.dy =
                Math.abs(ball.dy);
        }


        /*
         * Colisão com player
         */

        checkPlayerCollision(ball);


        /*
         * Colisão com blocos
         */

        checkBlockCollision(ball);
    }


    /*
     * Remove bolas que saíram da tela.
     */

    for (
        let i = balls.length - 1;
        i >= 0;
        i--
    ) {

        if (
            balls[i].y -
            balls[i].radius >
            canvas.height
        ) {

            balls.splice(i, 1);
        }
    }


    /*
     * Se todas as bolas caíram,
     * perde uma vida.
     */

    if (balls.length === 0) {

        loseLife();
    }
}


// ========================================
// COLISÃO COM PLAYER
// ========================================

function checkPlayerCollision(ball) {

    const ballBottom =
        ball.y +
        ball.radius;


    const playerTop =
        player.y;


    const playerBottom =
        player.y +
        player.height;


    const ballLeft =
        ball.x -
        ball.radius;


    const ballRight =
        ball.x +
        ball.radius;


    const playerLeft =
        player.x;


    const playerRight =
        player.x +
        player.width;


    const collision =
        ballBottom >= playerTop &&
        ball.y <= playerBottom &&
        ballRight >= playerLeft &&
        ballLeft <= playerRight;


    /*
     * Só rebate se a bola estiver descendo.
     */

    if (
        collision &&
        ball.dy > 0
    ) {

        ball.y =
            player.y -
            ball.radius;


        /*
         * Posição do impacto:
         *
         * -1 = extrema esquerda
         *  0 = centro
         * +1 = extrema direita
         */

        const hitPosition =
            (
                ball.x -
                (
                    player.x +
                    player.width / 2
                )
            ) /
            (
                player.width / 2
            );


        /*
         * Limita o valor entre -1 e 1.
         */

        const normalizedHit =
            Math.max(
                -1,
                Math.min(
                    1,
                    hitPosition
                )
            );


        /*
         * Quanto mais distante do centro,
         * mais diagonal será a trajetória.
         */

        const maxHorizontal =
            Math.min(
                ball.speed * 0.95,
                ballConfig.maximumHorizontalSpeed
            );


        ball.dx =
            normalizedHit *
            maxHorizontal;


        /*
         * Impede que a bola fique vertical
         * demais quando acerta exatamente
         * o centro da barra.
         */

        if (
            Math.abs(ball.dx) <
            ballConfig.minimumHorizontalSpeed
        ) {

            const direction =
                ball.dx < 0
                    ? -1
                    : 1;


            ball.dx =
                ballConfig.minimumHorizontalSpeed *
                direction;
        }


        /*
         * Recalcula DY para manter
         * aproximadamente a mesma velocidade.
         */

        const currentSpeed =
            Math.sqrt(
                ball.dx * ball.dx +
                ball.dy * ball.dy
            );


        const targetSpeed =
            ball.speed;


        const speedRatio =
            targetSpeed /
            currentSpeed;


        ball.dx *= speedRatio;
        ball.dy *= speedRatio;


        /*
         * Garante que a bola volte para cima.
         */

        ball.dy =
            -Math.abs(ball.dy);


        /*
         * Pequena variação aleatória.
         */

        ball.dx +=
            (Math.random() - 0.5) *
            0.25;


        limitBallHorizontalSpeed(ball);
    }
}


// ========================================
// LIMITAR VELOCIDADE HORIZONTAL
// ========================================

function limitBallHorizontalSpeed(ball) {

    if (
        ball.dx >
        ballConfig.maximumHorizontalSpeed
    ) {

        ball.dx =
            ballConfig.maximumHorizontalSpeed;
    }


    if (
        ball.dx <
        -ballConfig.maximumHorizontalSpeed
    ) {

        ball.dx =
            -ballConfig.maximumHorizontalSpeed;
    }


    /*
     * Evita trajetória vertical demais.
     */

    if (
        Math.abs(ball.dx) <
        ballConfig.minimumHorizontalSpeed
    ) {

        const direction =
            ball.dx >= 0
                ? 1
                : -1;


        ball.dx =
            ballConfig.minimumHorizontalSpeed *
            direction;
    }
}


// ========================================
// COLISÃO COM BLOCOS
// ========================================

function checkBlockCollision(ball) {

    for (const block of blocks) {

        if (block.destroyed) {
            continue;
        }


        const collision =
            ball.x +
            ball.radius >
            block.x &&

            ball.x -
            ball.radius <
            block.x +
            block.width &&

            ball.y +
            ball.radius >
            block.y &&

            ball.y -
            ball.radius <
            block.y +
            block.height;


        if (!collision) {
            continue;
        }


        block.destroyed = true;


        score += 10;

        updateScore();


        /*
         * Se o bloco possuir power-up,
         * cria o objeto que cairá.
         */

        if (
            block.powerUpType
        ) {

            createPowerUp(
                block.x +
                block.width / 2,

                block.y +
                block.height / 2,

                block.powerUpType
            );
        }


        /*
         * Descobre de qual lado
         * a bola atingiu o bloco.
         */

        const previousX =
            ball.x -
            ball.dx;


        const previousY =
            ball.y -
            ball.dy;


        const hitFromLeft =
            previousX +
            ball.radius <=
            block.x;


        const hitFromRight =
            previousX -
            ball.radius >=
            block.x +
            block.width;


        const hitFromTop =
            previousY +
            ball.radius <=
            block.y;


        const hitFromBottom =
            previousY -
            ball.radius >=
            block.y +
            block.height;


        /*
         * Colisão horizontal
         */

        if (
            hitFromLeft ||
            hitFromRight
        ) {

            ball.dx *= -1;
        }


        /*
         * Colisão vertical
         */

        else if (
            hitFromTop ||
            hitFromBottom
        ) {

            ball.dy *= -1;
        }


        /*
         * Caso não consiga determinar,
         * usa colisão vertical.
         */

        else {

            ball.dy *= -1;
        }


        /*
         * Pequena alteração de direção.
         */

        ball.dx +=
            (Math.random() - 0.5) *
            0.45;


        limitBallHorizontalSpeed(ball);


        /*
         * Aumenta gradualmente
         * a velocidade da bola.
         */

        increaseBallSpeed(ball);


        checkWin();


        break;
    }
}


// ========================================
// AUMENTAR VELOCIDADE DA BOLA
// ========================================

function increaseBallSpeed(ball) {

    if (
        ball.speed >=
        ballConfig.maxSpeed
    ) {
        return;
    }


    ball.speed += 0.04;


    if (
        ball.speed >
        ballConfig.maxSpeed
    ) {

        ball.speed =
            ballConfig.maxSpeed;
    }


    const currentSpeed =
        Math.sqrt(
            ball.dx * ball.dx +
            ball.dy * ball.dy
        );


    if (
        currentSpeed === 0
    ) {
        return;
    }


    const ratio =
        ball.speed /
        currentSpeed;


    ball.dx *= ratio;
    ball.dy *= ratio;


    limitBallHorizontalSpeed(ball);
}


// ========================================
// CRIAR POWER-UP
// ========================================

function createPowerUp(
    x,
    y,
    type
) {

    powerUps.push({

        x: x,
        y: y,

        width: 24,
        height: 24,

        speed: 2.2,

        type: type
    });
}


// ========================================
// ATUALIZAR POWER-UPS
// ========================================

function updatePowerUps() {

    for (
        let i = powerUps.length - 1;
        i >= 0;
        i--
    ) {

        const powerUp =
            powerUps[i];


        powerUp.y +=
            powerUp.speed;


        /*
         * Colisão com player
         */

        const collision =
            powerUp.x +
            powerUp.width / 2 >=
            player.x &&

            powerUp.x -
            powerUp.width / 2 <=
            player.x +
            player.width &&

            powerUp.y +
            powerUp.height / 2 >=
            player.y &&

            powerUp.y -
            powerUp.height / 2 <=
            player.y +
            player.height;


        if (collision) {

            activatePowerUp(
                powerUp.type
            );


            powerUps.splice(
                i,
                1
            );


            continue;
        }


        /*
         * Remove quando sair da tela.
         */

        if (
            powerUp.y -
            powerUp.height / 2 >
            canvas.height
        ) {

            powerUps.splice(
                i,
                1
            );
        }
    }
}


// ========================================
// ATIVAR POWER-UP
// ========================================

function activatePowerUp(type) {

    /*
     * Bônus de pontuação
     */

    score += 25;

    updateScore();


    // ====================================
    // EXPAND
    // ====================================

    if (
        type ===
        powerUpTypes.EXPAND
    ) {

        activateExpand();
    }


    // ====================================
    // MULTIBALL
    // ====================================

    if (
        type ===
        powerUpTypes.MULTIBALL
    ) {

        activateMultiball();
    }


    // ====================================
    // SLOW
    // ====================================

    if (
        type ===
        powerUpTypes.SLOW
    ) {

        activateSlow();
    }
}


// ========================================
// POWER-UP EXPAND
// ========================================

function activateExpand() {

    player.width =
        player.expandedWidth;


    powerUpState.expandActive =
        true;


    clearTimeout(
        powerUpState.expandTimer
    );


    powerUpState.expandTimer =
        setTimeout(() => {

            player.width =
                player.normalWidth;


            /*
             * Corrige a posição caso
             * a barra fique fora da tela.
             */

            if (
                player.x +
                player.width >
                canvas.width
            ) {

                player.x =
                    canvas.width -
                    player.width;
            }


            powerUpState.expandActive =
                false;

        }, 7000);
}


// ========================================
// POWER-UP MULTIBALL
// ========================================

function activateMultiball() {

    /*
     * Faz uma cópia das bolas existentes.
     *
     * Limitamos a 3 bolas para evitar
     * uma quantidade exagerada.
     */

    const originalBalls =
        [...balls];


    for (
        const originalBall
        of originalBalls
    ) {

        if (
            balls.length >= 3
        ) {
            break;
        }


        const newBall =
            createBall(
                originalBall.x,
                originalBall.y,
                originalBall.speed
            );


        /*
         * Faz a nova bola partir
         * para uma direção diferente.
         */

        newBall.dx =
            -originalBall.dx;


        newBall.dy =
            originalBall.dy;


        /*
         * Pequena variação no ângulo.
         */

        newBall.dx +=
            (Math.random() - 0.5) *
            2;


        limitBallHorizontalSpeed(
            newBall
        );


        balls.push(
            newBall
        );
    }
}


// ========================================
// POWER-UP SLOW
// ========================================

function activateSlow() {

    /*
     * Evita ativar várias reduções
     * simultaneamente.
     */

    powerUpState.slowActive =
        true;


    clearTimeout(
        powerUpState.slowTimer
    );


    /*
     * Reduz a velocidade atual
     * das bolas.
     */

    for (
        const ball
        of balls
    ) {

        ball.speed *= 0.55;


        ball.dx *= 0.55;
        ball.dy *= 0.55;


        /*
         * Garante uma velocidade mínima.
         */

        if (
            ball.speed < 2.5
        ) {

            ball.speed = 2.5;
        }
    }


    powerUpState.slowTimer =
        setTimeout(() => {

            for (
                const ball
                of balls
            ) {

                ball.speed *=
                    1.82;


                if (
                    ball.speed >
                    ballConfig.maxSpeed
                ) {

                    ball.speed =
                        ballConfig.maxSpeed;
                }


                const currentSpeed =
                    Math.sqrt(
                        ball.dx *
                        ball.dx +
                        ball.dy *
                        ball.dy
                    );


                if (
                    currentSpeed > 0
                ) {

                    const ratio =
                        ball.speed /
                        currentSpeed;


                    ball.dx *=
                        ratio;


                    ball.dy *=
                        ratio;
                }


                limitBallHorizontalSpeed(
                    ball
                );
            }


            powerUpState.slowActive =
                false;

        }, 5000);
}


// ========================================
// PERDER VIDA
// ========================================

function loseLife() {

    lives--;

    updateLives();


    if (
        lives <= 0
    ) {

        gameOver();

        return;
    }


    /*
     * Limpa power-ups da tela.
     */

    powerUps.length = 0;


    resetPlayer();
    resetBall();
}


// ========================================
// VERIFICAR VITÓRIA
// ========================================

function checkWin() {

    const remainingBlocks =
        blocks.some(
            block =>
                !block.destroyed
        );


    if (
        !remainingBlocks
    ) {

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

    return String(value)
        .padStart(4, "0");
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

    ctx.fillStyle =
        "#ffffff";


    ctx.fillRect(
        player.x,
        player.y,
        player.width,
        player.height
    );
}


// ========================================
// DESENHAR BOLAS
// ========================================

function drawBalls() {

    for (
        const ball
        of balls
    ) {

        if (
            !ball.active
        ) {
            continue;
        }


        ctx.beginPath();


        ctx.arc(
            ball.x,
            ball.y,
            ball.radius,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "#ffffff";


        ctx.fill();


        ctx.closePath();
    }
}


// ========================================
// DESENHAR BLOCOS
// ========================================

function drawBlocks() {

    for (
        const block
        of blocks
    ) {

        if (
            block.destroyed
        ) {
            continue;
        }


        ctx.fillStyle =
            "#ffffff";


        ctx.fillRect(
            block.x,
            block.y,
            block.width,
            block.height
        );


        /*
         * Indica visualmente que o bloco
         * possui um power-up.
         */

        if (
            block.powerUpType
        ) {

            drawPowerUpSymbol(
                block.x +
                block.width / 2,

                block.y +
                block.height / 2,

                block.powerUpType,

                true
            );
        }
    }
}


// ========================================
// DESENHAR POWER-UPS
// ========================================

function drawPowerUps() {

    for (
        const powerUp
        of powerUps
    ) {

        drawPowerUpSymbol(
            powerUp.x,
            powerUp.y,
            powerUp.type,
            false
        );
    }
}


// ========================================
// DESENHAR SÍMBOLO DO POWER-UP
// ========================================

function drawPowerUpSymbol(
    x,
    y,
    type,
    insideBlock
) {

    /*
     * Quando está dentro do bloco,
     * usamos preto.
     *
     * Quando está caindo,
     * usamos branco.
     */

    const color =
        insideBlock
            ? "#000000"
            : "#ffffff";


    ctx.fillStyle =
        color;


    ctx.strokeStyle =
        color;


    ctx.lineWidth = 2;


    // ====================================
    // EXPAND
    // ====================================

    if (
        type ===
        powerUpTypes.EXPAND
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x - 7,
            y
        );

        ctx.lineTo(
            x + 7,
            y
        );

        ctx.stroke();


        ctx.beginPath();

        ctx.moveTo(
            x - 7,
            y
        );

        ctx.lineTo(
            x - 3,
            y - 4
        );

        ctx.moveTo(
            x - 7,
            y
        );

        ctx.lineTo(
            x - 3,
            y + 4
        );

        ctx.moveTo(
            x + 7,
            y
        );

        ctx.lineTo(
            x + 3,
            y - 4
        );

        ctx.moveTo(
            x + 7,
            y
        );

        ctx.lineTo(
            x + 3,
            y + 4
        );

        ctx.stroke();

        return;
    }


    // ====================================
    // MULTIBALL
    // ====================================

    if (
        type ===
        powerUpTypes.MULTIBALL
    ) {

        ctx.beginPath();

        ctx.arc(
            x - 5,
            y,
            3,
            0,
            Math.PI * 2
        );

        ctx.arc(
            x + 5,
            y,
            3,
            0,
            Math.PI * 2
        );

        ctx.fill();

        return;
    }


    // ====================================
    // SLOW
    // ====================================

    if (
        type ===
        powerUpTypes.SLOW
    ) {

        ctx.font =
            "bold 14px Arial";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";


        ctx.fillText(
            "S",
            x,
            y
        );
    }
}


// ========================================
// FUNDO
// ========================================

function drawBackground() {

    ctx.fillStyle =
        "#050505";


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

    if (
        !gameRunning
    ) {

        return;
    }


    update();

    draw();


    animationId =
        requestAnimationFrame(
            gameLoop
        );
}


// ========================================
// UPDATE
// ========================================

function update() {

    updatePlayer();

    updateBalls();

    updatePowerUps();
}


// ========================================
// DRAW
// ========================================

function draw() {

    drawBackground();

    drawBlocks();

    drawPowerUps();

    drawPlayer();

    drawBalls();
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
```
