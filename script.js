document.addEventListener("DOMContentLoaded", () => {

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
    // VERIFICAÇÃO DOS ELEMENTOS
    // ========================================

    if (!canvas) {
        console.error("Canvas não encontrado.");
        return;
    }

    if (!startButton) {
        console.error("Botão de início não encontrado.");
        return;
    }


    // ========================================
    // PLAYER
    // ========================================

    const player = {

        width: 120,
        normalWidth: 120,
        expandedWidth: 190,

        height: 14,

        x: canvas.width / 2 - 60,
        y: canvas.height - 35,

        speed: 7
    };


    // ========================================
    // CONFIGURAÇÃO DA BOLA
    // ========================================

    const ballConfig = {

        initialSpeed: 5,

        maxSpeed: 8,

        minimumHorizontalSpeed: 1.8,

        maximumHorizontalSpeed: 7
    };


    // ========================================
    // BOLAS
    // ========================================

    let balls = [];


    // ========================================
    // BLOCOS
    // ========================================

    let blocks = [];


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

    let powerUps = [];


    const POWER_UP = {

        EXPAND: "expand",

        MULTIBALL: "multiball",

        SLOW: "slow"
    };


    // ========================================
    // ESTADO DOS POWER-UPS
    // ========================================

    let expandTimeout = null;

    let slowTimeout = null;


    // ========================================
    // ESTADO DO JOGO
    // ========================================

    let score = 0;

    let lives = 3;

    let gameRunning = false;

    let animationId = null;


    // ========================================
    // TECLADO
    // ========================================

    const keys = {

        left: false,

        right: false
    };


    // ========================================
    // TECLADO - PRESSIONAR
    // ========================================

    document.addEventListener("keydown", (event) => {

        const key = event.key.toLowerCase();


        if (
            key === "arrowleft" ||
            key === "a"
        ) {

            keys.left = true;

            event.preventDefault();
        }


        if (
            key === "arrowright" ||
            key === "d"
        ) {

            keys.right = true;

            event.preventDefault();
        }
    });


    // ========================================
    // TECLADO - SOLTAR
    // ========================================

    document.addEventListener("keyup", (event) => {

        const key = event.key.toLowerCase();


        if (
            key === "arrowleft" ||
            key === "a"
        ) {

            keys.left = false;

            event.preventDefault();
        }


        if (
            key === "arrowright" ||
            key === "d"
        ) {

            keys.right = false;

            event.preventDefault();
        }
    });


    // ========================================
    // CRIAR BLOCOS
    // ========================================

    function createBlocks() {

        blocks = [];


        for (
            let row = 0;
            row < blockConfig.rows;
            row++
        ) {

            for (
                let column = 0;
                column < blockConfig.columns;
                column++
            ) {

                const x =
                    blockConfig.startX +
                    column *
                    (
                        blockConfig.width +
                        blockConfig.gap
                    );


                const y =
                    blockConfig.startY +
                    row *
                    (
                        blockConfig.height +
                        blockConfig.gap
                    );


                /*
                 * Aproximadamente 25%
                 * dos blocos possuem poder.
                 */

                let powerUpType = null;


                if (Math.random() < 0.15) {

                    const types = [

                        POWER_UP.EXPAND,

                        POWER_UP.MULTIBALL,

                        POWER_UP.SLOW
                    ];


                    powerUpType =
                        types[
                            Math.floor(
                                Math.random() *
                                types.length
                            )
                        ];
                }


                blocks.push({

                    x,

                    y,

                    width:
                        blockConfig.width,

                    height:
                        blockConfig.height,

                    destroyed: false,

                    powerUpType
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
        speed = ballConfig.initialSpeed
    ) {

        /*
         * Ângulo entre 35° e 145°.
         *
         * Isso impede que a bola
         * comece quase horizontal.
         */

        const angle =
            (
                Math.random() *
                110 +
                35
            ) *
            (
                Math.PI / 180
            );


        const direction =
            Math.random() < 0.5
                ? -1
                : 1;


        return {

            x,

            y,

            radius: 8,

            speed,

            dx:
                Math.cos(angle) *
                speed *
                direction,

            dy:
                -Math.sin(angle) *
                speed
        };
    }


    // ========================================
    // RESETAR BOLA
    // ========================================

    function resetBall() {

        balls = [];


        const ball =
            createBall(
                canvas.width / 2,

                canvas.height - 70
            );


        balls.push(ball);
    }


    // ========================================
    // RESETAR PLAYER
    // ========================================

    function resetPlayer() {

        player.width =
            player.normalWidth;


        player.x =
            canvas.width / 2 -
            player.width / 2;
    }


    // ========================================
    // RESETAR POWER-UPS
    // ========================================

    function resetPowerUps() {

        powerUps = [];


        clearTimeout(
            expandTimeout
        );


        clearTimeout(
            slowTimeout
        );


        player.width =
            player.normalWidth;
    }


    // ========================================
    // INICIAR JOGO
    // ========================================

    function startGame() {

        console.log(
            "Pong Blocks iniciado!"
        );


        /*
         * Para uma possível partida
         * anterior.
         */

        cancelAnimationFrame(
            animationId
        );


        score = 0;

        lives = 3;


        updateScore();

        updateLives();


        resetPlayer();

        resetBall();

        resetPowerUps();

        createBlocks();


        /*
         * Esconde todas as telas.
         */

        startScreen.classList.add(
            "hidden"
        );


        gameOverScreen.classList.add(
            "hidden"
        );


        winScreen.classList.add(
            "hidden"
        );


        gameRunning = true;


        /*
         * Começa o loop.
         */

        gameLoop();
    }


    // ========================================
    // MOVIMENTO DO PLAYER
    // ========================================

    function updatePlayer() {

        if (keys.left) {

            player.x -=
                player.speed;
        }


        if (keys.right) {

            player.x +=
                player.speed;
        }


        /*
         * Limite esquerdo.
         */

        if (player.x < 0) {

            player.x = 0;
        }


        /*
         * Limite direito.
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

        /*
         * Atualiza todas as bolas.
         */

        for (const ball of balls) {

            ball.x += ball.dx;

            ball.y += ball.dy;


            // -------------------------------
            // PAREDE ESQUERDA
            // -------------------------------

            if (
                ball.x -
                ball.radius <= 0
            ) {

                ball.x =
                    ball.radius;

                ball.dx =
                    Math.abs(
                        ball.dx
                    );
            }


            // -------------------------------
            // PAREDE DIREITA
            // -------------------------------

            if (
                ball.x +
                ball.radius >=
                canvas.width
            ) {

                ball.x =
                    canvas.width -
                    ball.radius;

                ball.dx =
                    -Math.abs(
                        ball.dx
                    );
            }


            // -------------------------------
            // PAREDE SUPERIOR
            // -------------------------------

            if (
                ball.y -
                ball.radius <= 0
            ) {

                ball.y =
                    ball.radius;

                ball.dy =
                    Math.abs(
                        ball.dy
                    );
            }


            // -------------------------------
            // PLAYER
            // -------------------------------

            checkPlayerCollision(
                ball
            );


            // -------------------------------
            // BLOCOS
            // -------------------------------

            checkBlockCollision(
                ball
            );
        }


        /*
         * Remove bolas que saíram
         * pela parte inferior.
         */

        balls =
            balls.filter(
                ball =>
                    ball.y -
                    ball.radius <=
                    canvas.height
            );


        /*
         * Se nenhuma bola restou,
         * perde uma vida.
         */

        if (
            balls.length === 0
        ) {

            loseLife();
        }
    }


    // ========================================
    // COLISÃO PLAYER
    // ========================================

    function checkPlayerCollision(
        ball
    ) {

        const ballBottom =
            ball.y +
            ball.radius;


        const ballLeft =
            ball.x -
            ball.radius;


        const ballRight =
            ball.x +
            ball.radius;


        const collision =

            ballBottom >=
            player.y &&

            ball.y <=
            player.y +
            player.height &&

            ballRight >=
            player.x &&

            ballLeft <=
            player.x +
            player.width;


        /*
         * Só rebate quando a bola
         * está descendo.
         */

        if (
            collision &&
            ball.dy > 0
        ) {

            ball.y =
                player.y -
                ball.radius;


            /*
             * Descobre onde a bola
             * bateu na barra.
             *
             * -1 = esquerda
             *  0 = centro
             * +1 = direita
             */

            let hitPosition =
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
             * Mantém entre -1 e 1.
             */

            hitPosition =
                Math.max(
                    -1,
                    Math.min(
                        1,
                        hitPosition
                    )
                );


            /*
             * Velocidade horizontal
             * baseada na posição.
             */

            const maxHorizontal =
                Math.min(
                    ball.speed * 0.95,
                    ballConfig.maximumHorizontalSpeed
                );


            ball.dx =
                hitPosition *
                maxHorizontal;


            /*
             * Impede que a bola
             * fique completamente vertical.
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


            /*
             * Recalcula DY para
             * manter a velocidade.
             */

            const horizontal =
                ball.dx;


            const verticalSquared =
                (
                    ball.speed *
                    ball.speed
                ) -
                (
                    horizontal *
                    horizontal
                );


            const vertical =
                Math.sqrt(
                    Math.max(
                        1,
                        verticalSquared
                    )
                );


            ball.dy =
                -vertical;


            /*
             * Pequena variação.
             */

            ball.dx +=
                (
                    Math.random() -
                    0.5
                ) *
                0.25;


            limitHorizontalSpeed(
                ball
            );
        }
    }


    // ========================================
    // LIMITAR VELOCIDADE HORIZONTAL
    // ========================================

    function limitHorizontalSpeed(
        ball
    ) {

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
         * Evita trajetória quase vertical.
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


        /*
         * Garante que a bola
         * continue subindo após a barra.
         */

        ball.dy =
            -Math.abs(
                ball.dy
            );
    }


    // ========================================
    // COLISÃO COM BLOCOS
    // ========================================

    function checkBlockCollision(
        ball
    ) {

        for (
            const block of blocks
        ) {

            if (
                block.destroyed
            ) {
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


            /*
             * Destrói o bloco.
             */

            block.destroyed =
                true;


            /*
             * Pontuação.
             */

            score += 10;

            updateScore();


            /*
             * Cria o power-up
             * se o bloco possuir um.
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
             * Calcula a penetração
             * em cada lado do bloco.
             */

            const overlapLeft =
                (ball.x + ball.radius) - block.x;

            const overlapRight =
                (block.x + block.width) - (ball.x - ball.radius);

            const overlapTop =
                (ball.y + ball.radius) - block.y;

            const overlapBottom =
                (block.y + block.height) - (ball.y - ball.radius);

            const minOverlapX = Math.min(
                overlapLeft,
                overlapRight
            );

            const minOverlapY = Math.min(
                overlapTop,
                overlapBottom
            );

            if (minOverlapX < minOverlapY) {

                ball.dx = -ball.dx;

                if (overlapLeft < overlapRight) {
                    ball.x = block.x - ball.radius;
                } else {
                    ball.x = block.x + block.width + ball.radius;
                }
            } else {

                ball.dy = -ball.dy;

                if (overlapTop < overlapBottom) {
                    ball.y = block.y - ball.radius;
                } else {
                    ball.y = block.y + block.height + ball.radius;
                }
            }


            /*
             * Pequena alteração
             * para variar a trajetória.
             */

            ball.dx +=
                (
                    Math.random() -
                    0.5
                ) *
                0.4;


            increaseBallSpeed(
                ball
            );


            checkWin();


            /*
             * Uma bola só pode destruir
             * um bloco por frame.
             */

            break;
        }
    }


    // ========================================
    // AUMENTAR VELOCIDADE
    // ========================================

    function increaseBallSpeed(
        ball
    ) {

        if (
            ball.speed >=
            ballConfig.maxSpeed
        ) {
            return;
        }


        ball.speed += 0.03;


        if (
            ball.speed >
            ballConfig.maxSpeed
        ) {

            ball.speed =
                ballConfig.maxSpeed;
        }


        /*
         * Normaliza a direção.
         */

        const currentSpeed =
            Math.sqrt(
                ball.dx *
                ball.dx +

                ball.dy *
                ball.dy
            );


        if (
            currentSpeed <= 0
        ) {
            return;
        }


        const ratio =
            ball.speed /
            currentSpeed;


        ball.dx *=
            ratio;


        ball.dy *=
            ratio;


        limitHorizontalSpeed(
            ball
        );
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

            x,

            y,

            width: 24,

            height: 24,

            speed: 2.2,

            type
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


            /*
             * Faz o poder cair.
             */

            powerUp.y +=
                powerUp.speed;


            /*
             * Colisão com a barra.
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
             * Remove se sair da tela.
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

    function activatePowerUp(
        type
    ) {

        /*
         * Bônus.
         */

        score += 25;

        updateScore();


        switch (type) {

            case POWER_UP.EXPAND:

                activateExpand();

                break;


            case POWER_UP.MULTIBALL:

                activateMultiball();

                break;


            case POWER_UP.SLOW:

                activateSlow();

                break;
        }
    }


    // ========================================
    // POWER-UP: EXPAND
    // ========================================

    function activateExpand() {

        player.width =
            player.expandedWidth;


        clearTimeout(
            expandTimeout
        );


        expandTimeout =
            setTimeout(() => {

                player.width =
                    player.normalWidth;


                /*
                 * Corrige a posição
                 * da barra.
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

            }, 7000);
    }


    // ========================================
    // POWER-UP: MULTIBALL
    // ========================================

    function activateMultiball() {

        /*
         * Limite de 3 bolas.
         */

        if (
            balls.length >= 3
        ) {

            return;
        }


        /*
         * Copia as bolas atuais
         * antes de adicionar novas.
         */

        const currentBalls =
            [...balls];


        for (
            const originalBall
            of currentBalls
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
             * Direção contrária.
             */

            newBall.dx =
                -originalBall.dx;


            newBall.dy =
                originalBall.dy;


            /*
             * Pequena variação.
             */

            newBall.dx +=
                (
                    Math.random() -
                    0.5
                ) *
                2;


            limitHorizontalSpeed(
                newBall
            );


            balls.push(
                newBall
            );
        }
    }


    // ========================================
    // POWER-UP: SLOW
    // ========================================

    function activateSlow() {

        /*
         * Diminui as bolas.
         */

        for (
            const ball of balls
        ) {

            ball.speed *=
                0.55;


            ball.dx *=
                0.55;


            ball.dy *=
                0.55;


            if (
                ball.speed < 2.5
            ) {

                ball.speed =
                    2.5;
            }
        }


        clearTimeout(
            slowTimeout
        );


        slowTimeout =
            setTimeout(() => {

                for (
                    const ball of balls
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


                    limitHorizontalSpeed(
                        ball
                    );
                }

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
         * Remove power-ups da tela.
         */

        powerUps = [];


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
            formatScore(
                score
            );


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
            formatScore(
                score
            );


        winScreen.classList.remove(
            "hidden"
        );
    }


    // ========================================
    // SCORE
    // ========================================

    function updateScore() {

        scoreElement.textContent =
            formatScore(
                score
            );
    }


    function formatScore(
        value
    ) {

        return String(value)
            .padStart(
                4,
                "0"
            );
    }


    // ========================================
    // VIDAS
    // ========================================

    function updateLives() {

        livesElement.textContent =
            "♥".repeat(
                Math.max(
                    0,
                    lives
                )
            );
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
            const ball of balls
        ) {

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
            const block of blocks
        ) {

            if (
                block.destroyed
            ) {

                continue;
            }


            /*
             * Bloco.
             */

            ctx.fillStyle =
                "#ffffff";


            ctx.fillRect(

                block.x,

                block.y,

                block.width,

                block.height
            );


            /*
             * Símbolo do power-up.
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
            const powerUp of powerUps
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
    // DESENHAR SÍMBOLO POWER-UP
    // ========================================

    function drawPowerUpSymbol(

        x,

        y,

        type,

        insideBlock
    ) {

        const color =
            insideBlock
                ? "#000000"
                : "#ffffff";


        ctx.fillStyle =
            color;


        ctx.strokeStyle =
            color;


        ctx.lineWidth = 2;


        // ------------------------------------
        // EXPAND
        // ------------------------------------

        if (
            type ===
            POWER_UP.EXPAND
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


        // ------------------------------------
        // MULTIBALL
        // ------------------------------------

        if (
            type ===
            POWER_UP.MULTIBALL
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


        // ------------------------------------
        // SLOW
        // ------------------------------------

        if (
            type ===
            POWER_UP.SLOW
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
    // DESENHAR JOGO
    // ========================================

    function draw() {

        drawBackground();

        drawBlocks();

        drawPowerUps();

        drawPlayer();

        drawBalls();
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
    // BOTÃO INICIAR
    // ========================================

    startButton.addEventListener(
        "click",
        () => {

            startGame();
        }
    );


    // ========================================
    // BOTÃO REINICIAR
    // ========================================

    restartButton.addEventListener(
        "click",
        () => {

            startGame();
        }
    );


    // ========================================
    // BOTÃO JOGAR NOVAMENTE
    // ========================================

    nextButton.addEventListener(
        "click",
        () => {

            startGame();
        }
    );


    // ========================================
    // ESTADO INICIAL
    // ========================================

    createBlocks();

    updateScore();

    updateLives();

    resetPlayer();

    resetBall();

    draw();


    console.log(
        "Pong Blocks V1 carregado com sucesso."
    );

});
