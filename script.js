document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const W = 960;
    const H = 600;
    const COLORS = ["#73e0c1", "#76c7ff", "#a78bfa", "#ff8fba", "#ffae8a", "#ffd66b"];
    const POWER = { WIDE: "wide", MULTI: "multi", SLOW: "slow", LIFE: "life" };
    const POWER_INFO = {
        [POWER.WIDE]: { icon: "↔", label: "Barra ampliada", color: "#73e0c1" },
        [POWER.MULTI]: { icon: "●", label: "Multibola ativada", color: "#ff8fba" },
        [POWER.SLOW]: { icon: "◇", label: "Câmera lenta", color: "#a78bfa" },
        [POWER.LIFE]: { icon: "+", label: "Vida extra", color: "#ffd66b" }
    };

    const canvas = document.querySelector("#gameCanvas");
    const ctx = canvas.getContext("2d");
    const elements = {
        stage: document.querySelector("#gameStage"),
        shell: document.querySelector(".game-shell"),
        score: document.querySelector("#score"),
        best: document.querySelector("#bestScore"),
        level: document.querySelector("#level"),
        lives: document.querySelector("#lives"),
        start: document.querySelector("#startScreen"),
        pause: document.querySelector("#pauseScreen"),
        end: document.querySelector("#endScreen"),
        countdown: document.querySelector("#countdown"),
        countdownText: document.querySelector("#countdownText"),
        startButton: document.querySelector("#startButton"),
        resumeButton: document.querySelector("#resumeButton"),
        restartButton: document.querySelector("#restartButton"),
        restartLabel: document.querySelector("#restartLabel"),
        pauseButton: document.querySelector("#pauseButton"),
        soundButton: document.querySelector("#soundButton"),
        soundIcon: document.querySelector("#soundIcon"),
        fullscreenButton: document.querySelector("#fullscreenButton"),
        fullscreenIcon: document.querySelector("#fullscreenIcon"),
        finalScore: document.querySelector("#finalScore"),
        finalBest: document.querySelector("#finalBest"),
        endEyebrow: document.querySelector("#endEyebrow"),
        endTitle: document.querySelector("#endTitle"),
        endMessage: document.querySelector("#endMessage"),
        statusPill: document.querySelector("#statusPill"),
        statusIcon: document.querySelector("#statusIcon"),
        statusText: document.querySelector("#statusText"),
        levelProgress: document.querySelector("#levelProgress"),
        progressFill: document.querySelector("#progressFill"),
        progressText: document.querySelector("#progressText"),
        announcer: document.querySelector("#announcer"),
        leftButton: document.querySelector("#moveLeft"),
        rightButton: document.querySelector("#moveRight")
    };

    let dpr = 1;
    let state = "menu";
    let endMode = "gameover";
    let score = 0;
    let bestScore = loadBestScore();
    let previousBest = bestScore;
    let level = 1;
    let lives = 3;
    let combo = 0;
    let countdownTimer = 0;
    let countdownTick = -1;
    let lastTime = performance.now();
    let shake = 0;
    let statusTimer = 0;
    let soundEnabled = true;
    let audioContext = null;

    let balls = [];
    let bricks = [];
    let drops = [];
    let particles = [];

    const keys = { left: false, right: false };
    const pointer = { active: false, x: W / 2 };
    const activePower = { wide: 0, slow: 0 };
    const player = {
        x: W / 2 - 68,
        y: H - 45,
        width: 136,
        normalWidth: 136,
        wideWidth: 210,
        height: 14,
        speed: 700,
        velocity: 0
    };

    const stars = Array.from({ length: 70 }, (_, index) => ({
        x: (index * 137.51) % W,
        y: (index * 83.17) % H,
        size: 0.5 + (index % 3) * 0.35,
        alpha: 0.12 + (index % 5) * 0.035
    }));

    function loadBestScore() {
        try { return Number.parseInt(localStorage.getItem("pong-blocks-best"), 10) || 0; }
        catch { return 0; }
    }

    function saveBestScore() {
        try { localStorage.setItem("pong-blocks-best", String(bestScore)); }
        catch {}
    }

    function fitCanvas() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function formatNumber(value) {
        return String(Math.max(0, Math.floor(value))).padStart(6, "0");
    }

    function refreshHud() {
        elements.score.textContent = formatNumber(score);
        elements.best.textContent = formatNumber(bestScore);
        elements.level.textContent = String(level).padStart(2, "0");
        elements.lives.textContent = lives > 0 ? "● ".repeat(lives).trim() : "—";
        elements.lives.setAttribute("aria-label", `${lives} ${lives === 1 ? "vida" : "vidas"}`);
        refreshProgress();
    }

    function refreshProgress() {
        const total = bricks.length || 1;
        const destroyed = bricks.filter(brick => !brick.alive).length;
        const percentage = Math.round(destroyed / total * 100);
        elements.progressFill.style.width = `${percentage}%`;
        elements.progressText.textContent = `${percentage}%`;
        elements.levelProgress.setAttribute("aria-label", `Progresso da fase: ${percentage}%`);
    }

    function addScore(points) {
        score += points;
        if (score > bestScore) {
            bestScore = score;
            saveBestScore();
        }
        refreshHud();
    }

    function setScreen(name) {
        elements.start.classList.toggle("hidden", name !== "start");
        elements.pause.classList.toggle("hidden", name !== "pause");
        elements.end.classList.toggle("hidden", name !== "end");
    }

    function resetPlayer() {
        player.width = player.normalWidth;
        player.x = W / 2 - player.width / 2;
        player.velocity = 0;
        activePower.wide = 0;
        activePower.slow = 0;
    }

    function makeBall(x = player.x + player.width / 2, y = player.y - 16, direction = Math.random() < 0.5 ? -1 : 1) {
        const speed = Math.min(370 + (level - 1) * 22, 560);
        const angle = (28 + Math.random() * 18) * Math.PI / 180;
        return {
            x, y, radius: 8, vx: Math.sin(angle) * speed * direction,
            vy: -Math.cos(angle) * speed, trail: [], locked: true
        };
    }

    function resetBalls() {
        balls = [makeBall()];
    }

    function choosePower() {
        const roll = Math.random();
        if (roll < 0.36) return POWER.WIDE;
        if (roll < 0.66) return POWER.MULTI;
        if (roll < 0.91) return POWER.SLOW;
        return POWER.LIFE;
    }

    function createBricks() {
        bricks = [];
        const columns = 10;
        const rows = Math.min(4 + Math.floor((level - 1) / 2), 7);
        const gap = 10;
        const side = 45;
        const top = 76;
        const height = 25;
        const width = (W - side * 2 - gap * (columns - 1)) / columns;

        for (let row = 0; row < rows; row += 1) {
            for (let column = 0; column < columns; column += 1) {
                const reinforced = level >= 3 && Math.random() < Math.min(0.11 + level * 0.018, 0.28);
                const hasPower = Math.random() < 0.17;
                bricks.push({
                    x: side + column * (width + gap), y: top + row * (height + gap),
                    width, height, hp: reinforced ? 2 : 1, maxHp: reinforced ? 2 : 1,
                    color: COLORS[row % COLORS.length], power: hasPower ? choosePower() : null,
                    alive: true, flash: 0
                });
            }
        }
    }

    function startNewGame() {
        ensureAudio();
        previousBest = bestScore;
        score = 0;
        level = 1;
        lives = 3;
        combo = 0;
        drops = [];
        particles = [];
        resetPlayer();
        createBricks();
        resetBalls();
        refreshHud();
        setScreen(null);
        elements.levelProgress.classList.remove("hidden");
        elements.pauseButton.disabled = false;
        beginCountdown(3);
        tone(440, 0.06, "sine", 0.035);
    }

    function beginCountdown(duration = 2) {
        state = "countdown";
        countdownTimer = duration;
        countdownTick = -1;
        elements.countdown.classList.remove("hidden");
        balls.forEach(ball => { ball.locked = true; });
    }

    function updateCountdown(dt) {
        updatePlayer(dt);
        balls.forEach((ball, index) => {
            ball.x = player.x + player.width / 2 + index * 10;
            ball.y = player.y - ball.radius - 3;
        });
        countdownTimer -= dt;
        const nextTick = Math.max(1, Math.ceil(countdownTimer));
        if (nextTick !== countdownTick && countdownTimer > 0) {
            countdownTick = nextTick;
            elements.countdownText.textContent = String(nextTick);
            elements.countdownText.style.animation = "none";
            void elements.countdownText.offsetWidth;
            elements.countdownText.style.animation = "";
            tone(330 + nextTick * 60, 0.06, "sine", 0.03);
        }
        if (countdownTimer <= 0) {
            elements.countdown.classList.add("hidden");
            balls.forEach(ball => { ball.locked = false; });
            state = "playing";
            elements.announcer.textContent = "Valendo!";
            tone(720, 0.09, "triangle", 0.045);
        }
    }

    function startNextLevel() {
        level += 1;
        combo = 0;
        drops = [];
        resetPlayer();
        createBricks();
        resetBalls();
        refreshHud();
        setScreen(null);
        elements.levelProgress.classList.remove("hidden");
        elements.pauseButton.disabled = false;
        beginCountdown(3);
    }

    function pauseGame() {
        if (state !== "playing" && state !== "countdown") return;
        state = "paused";
        elements.countdown.classList.add("hidden");
        setScreen("pause");
        elements.pauseButton.setAttribute("aria-label", "Continuar jogo");
        elements.pauseButton.dataset.tooltip = "Continuar";
        elements.announcer.textContent = "Jogo pausado";
    }

    function resumeGame() {
        if (state !== "paused") return;
        setScreen(null);
        elements.pauseButton.setAttribute("aria-label", "Pausar jogo");
        elements.pauseButton.dataset.tooltip = "Pausar";
        beginCountdown(2);
    }

    function togglePause() {
        if (state === "paused") resumeGame();
        else pauseGame();
    }

    function finishLevel() {
        if (state !== "playing") return;
        state = "levelclear";
        addScore(400 * level + lives * 100);
        endMode = "levelclear";
        elements.endEyebrow.innerHTML = "<span></span> ARENA LIMPA";
        elements.endTitle.textContent = "NÍVEL CONCLUÍDO!";
        elements.endMessage.textContent = `Perfeito! O nível ${level + 1} vem mais rápido e com blocos reforçados.`;
        elements.restartLabel.textContent = "PRÓXIMO NÍVEL";
        showEndScreen();
        burst(W / 2, H / 2, "#73e0c1", 48, 280);
        tone(640, 0.12, "triangle", 0.05);
        tone(860, 0.18, "triangle", 0.04, 0.12);
    }

    function gameOver() {
        state = "gameover";
        endMode = "gameover";
        elements.endEyebrow.innerHTML = "<span></span> FIM DE JOGO";
        elements.endTitle.textContent = score > previousBest ? "NOVO RECORDE!" : "QUASE LÁ!";
        elements.endMessage.textContent = `Você chegou ao nível ${level}. Volte para quebrar ainda mais blocos.`;
        elements.restartLabel.textContent = "JOGAR NOVAMENTE";
        showEndScreen();
        tone(190, 0.22, "sawtooth", 0.035);
        tone(120, 0.3, "sine", 0.03, 0.12);
    }

    function showEndScreen() {
        elements.finalScore.textContent = formatNumber(score);
        elements.finalBest.textContent = formatNumber(bestScore);
        elements.pauseButton.disabled = true;
        setScreen("end");
    }

    function loseLife() {
        if (state !== "playing") return;
        lives -= 1;
        combo = 0;
        refreshHud();
        shake = 11;
        tone(150, 0.16, "sawtooth", 0.04);
        if (lives <= 0) {
            gameOver();
            return;
        }
        drops = [];
        resetPlayer();
        resetBalls();
        showStatus("♥", `Restam ${lives} ${lives === 1 ? "vida" : "vidas"}`, "#ff789f");
        beginCountdown(2);
    }

    function updatePlayer(dt) {
        const oldX = player.x;
        let direction = 0;
        if (keys.left) direction -= 1;
        if (keys.right) direction += 1;

        if (direction !== 0) {
            player.x += direction * player.speed * dt;
            pointer.active = false;
        } else if (pointer.active) {
            const target = pointer.x - player.width / 2;
            const distance = target - player.x;
            const maxMove = player.speed * 1.3 * dt;
            player.x += Math.max(-maxMove, Math.min(maxMove, distance));
        }
        player.x = Math.max(8, Math.min(W - player.width - 8, player.x));
        player.velocity = dt > 0 ? (player.x - oldX) / dt : 0;
    }

    function updateGame(dt) {
        updatePlayer(dt);
        updatePowerTimers(dt);
        updateBalls(dt);
        if (state !== "playing") return;
        updateDrops(dt);
        bricks.forEach(brick => { brick.flash = Math.max(0, brick.flash - dt * 5); });
    }

    function updatePowerTimers(dt) {
        if (activePower.wide > 0) {
            activePower.wide -= dt;
            if (activePower.wide <= 0) {
                const center = player.x + player.width / 2;
                player.width = player.normalWidth;
                player.x = Math.max(8, Math.min(W - player.width - 8, center - player.width / 2));
            }
        }
        if (activePower.slow > 0) {
            activePower.slow -= dt;
            if (activePower.slow <= 0) {
                balls.forEach(ball => scaleVelocity(ball, 1 / 0.72));
            }
        }
    }

    function updateBalls(dt) {
        const fastest = Math.max(1, ...balls.map(ball => Math.hypot(ball.vx, ball.vy)));
        const steps = Math.min(5, Math.max(1, Math.ceil(fastest * dt / 7)));
        const step = dt / steps;

        for (let s = 0; s < steps; s += 1) {
            for (let index = balls.length - 1; index >= 0; index -= 1) {
                const ball = balls[index];
                if (ball.locked) continue;
                ball.trail.unshift({ x: ball.x, y: ball.y });
                if (ball.trail.length > 7) ball.trail.pop();
                ball.x += ball.vx * step;
                ball.y += ball.vy * step;

                if (ball.x - ball.radius <= 7) {
                    ball.x = 7 + ball.radius;
                    ball.vx = Math.abs(ball.vx);
                    wallHit(ball.x, ball.y);
                } else if (ball.x + ball.radius >= W - 7) {
                    ball.x = W - 7 - ball.radius;
                    ball.vx = -Math.abs(ball.vx);
                    wallHit(ball.x, ball.y);
                }
                if (ball.y - ball.radius <= 7) {
                    ball.y = 7 + ball.radius;
                    ball.vy = Math.abs(ball.vy);
                    wallHit(ball.x, ball.y);
                }

                collidePaddle(ball);
                collideBricks(ball);
                if (state !== "playing") return;

                if (ball.y - ball.radius > H + 12) balls.splice(index, 1);
            }
        }
        if (balls.length === 0) loseLife();
    }

    function wallHit(x, y) {
        spark(x, y, "#b8a9e8", 2);
        tone(235, 0.018, "sine", 0.012);
    }

    function collidePaddle(ball) {
        if (ball.vy <= 0) return;
        if (ball.x + ball.radius < player.x || ball.x - ball.radius > player.x + player.width) return;
        if (ball.y + ball.radius < player.y || ball.y - ball.radius > player.y + player.height + 7) return;

        ball.y = player.y - ball.radius - 1;
        const hit = Math.max(-1, Math.min(1, (ball.x - (player.x + player.width / 2)) / (player.width / 2)));
        const speed = Math.min(Math.max(Math.hypot(ball.vx, ball.vy) + 7, 360), 690);
        const angle = hit * 1.08;
        ball.vx = Math.sin(angle) * speed + player.velocity * 0.08;
        ball.vy = -Math.abs(Math.cos(angle) * speed);
        normalizeBall(ball, speed);
        combo = 0;
        burst(ball.x, player.y, "#73e0c1", 7, 100);
        tone(250 + Math.abs(hit) * 90, 0.035, "square", 0.02);
    }

    function collideBricks(ball) {
        for (const brick of bricks) {
            if (!brick.alive) continue;
            const nearestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
            const nearestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
            const dx = ball.x - nearestX;
            const dy = ball.y - nearestY;
            if (dx * dx + dy * dy > ball.radius * ball.radius) continue;

            const overlapLeft = ball.x + ball.radius - brick.x;
            const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
            const overlapTop = ball.y + ball.radius - brick.y;
            const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);
            const minX = Math.min(overlapLeft, overlapRight);
            const minY = Math.min(overlapTop, overlapBottom);
            if (minX < minY) ball.vx *= -1;
            else ball.vy *= -1;

            brick.hp -= 1;
            brick.flash = 1;
            shake = Math.max(shake, brick.hp <= 0 ? 3.5 : 2);
            if (brick.hp <= 0) {
                brick.alive = false;
                combo = Math.min(combo + 1, 12);
                addScore(10 * level * Math.max(1, combo));
                refreshProgress();
                burst(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 10, 150);
                if (brick.power) createDrop(brick);
                tone(430 + combo * 26, 0.04, "triangle", 0.026);
                if (!bricks.some(item => item.alive)) finishLevel();
            } else {
                addScore(5 * level);
                spark(ball.x, ball.y, brick.color, 5);
                tone(310, 0.035, "square", 0.018);
            }
            return;
        }
    }

    function normalizeBall(ball, desiredSpeed) {
        const current = Math.hypot(ball.vx, ball.vy) || 1;
        const target = Math.min(desiredSpeed, 690);
        ball.vx = ball.vx / current * target;
        ball.vy = ball.vy / current * target;
        if (Math.abs(ball.vx) < 95) {
            ball.vx = 95 * (ball.vx < 0 ? -1 : 1);
            const vertical = Math.sqrt(Math.max(target * target - ball.vx * ball.vx, 1));
            ball.vy = vertical * (ball.vy < 0 ? -1 : 1);
        }
    }

    function scaleVelocity(ball, factor) {
        ball.vx *= factor;
        ball.vy *= factor;
    }

    function createDrop(brick) {
        drops.push({
            x: brick.x + brick.width / 2, y: brick.y + brick.height / 2,
            type: brick.power, size: 25, speed: 120, rotation: 0
        });
    }

    function updateDrops(dt) {
        for (let index = drops.length - 1; index >= 0; index -= 1) {
            const drop = drops[index];
            drop.y += drop.speed * dt;
            drop.rotation += dt * 2;
            const caught = drop.x + drop.size / 2 >= player.x && drop.x - drop.size / 2 <= player.x + player.width && drop.y + drop.size / 2 >= player.y && drop.y - drop.size / 2 <= player.y + player.height;
            if (caught) {
                activatePower(drop.type);
                drops.splice(index, 1);
            } else if (drop.y - drop.size > H) drops.splice(index, 1);
        }
    }

    function activatePower(type) {
        addScore(75 * level);
        const info = POWER_INFO[type];
        showStatus(info.icon, info.label, info.color);
        burst(player.x + player.width / 2, player.y, info.color, 18, 180);
        tone(740, 0.07, "triangle", 0.045);

        if (type === POWER.WIDE) {
            const center = player.x + player.width / 2;
            player.width = player.wideWidth;
            player.x = Math.max(8, Math.min(W - player.width - 8, center - player.width / 2));
            activePower.wide = 9;
        } else if (type === POWER.MULTI) {
            const originals = [...balls];
            for (const original of originals) {
                if (balls.length >= 3) break;
                const clone = { ...original, vx: -original.vx * 0.92, vy: original.vy, trail: [] };
                normalizeBall(clone, Math.hypot(original.vx, original.vy));
                balls.push(clone);
            }
        } else if (type === POWER.SLOW) {
            if (activePower.slow <= 0) balls.forEach(ball => scaleVelocity(ball, 0.72));
            activePower.slow = 6;
        } else if (type === POWER.LIFE) {
            lives = Math.min(lives + 1, 5);
            refreshHud();
        }
    }

    function showStatus(icon, message, color) {
        elements.statusIcon.textContent = icon;
        elements.statusText.textContent = message;
        elements.statusPill.style.color = color;
        elements.statusPill.style.borderColor = `${color}55`;
        elements.statusPill.classList.remove("hidden");
        elements.announcer.textContent = message;
        statusTimer = 2.4;
    }

    function spark(x, y, color, count) {
        burst(x, y, color, count, 85);
    }

    function burst(x, y, color, count = 8, speed = 120) {
        for (let index = 0; index < count; index += 1) {
            const angle = Math.random() * Math.PI * 2;
            const force = speed * (0.35 + Math.random() * 0.65);
            particles.push({
                x, y, vx: Math.cos(angle) * force, vy: Math.sin(angle) * force,
                life: 0.35 + Math.random() * 0.4, maxLife: 0.75,
                size: 1.5 + Math.random() * 3.5, color
            });
        }
        if (particles.length > 260) particles.splice(0, particles.length - 260);
    }

    function updateEffects(dt) {
        shake = Math.max(0, shake - dt * 28);
        if (statusTimer > 0) {
            statusTimer -= dt;
            if (statusTimer <= 0) elements.statusPill.classList.add("hidden");
        }
        for (let index = particles.length - 1; index >= 0; index -= 1) {
            const particle = particles[index];
            particle.life -= dt;
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.vx *= Math.pow(0.035, dt);
            particle.vy *= Math.pow(0.035, dt);
            if (particle.life <= 0) particles.splice(index, 1);
        }
    }

    function roundRect(x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + width, y, x + width, y + height, r);
        ctx.arcTo(x + width, y + height, x, y + height, r);
        ctx.arcTo(x, y + height, x, y, r);
        ctx.arcTo(x, y, x + width, y, r);
        ctx.closePath();
    }

    function drawBackground(time) {
        const gradient = ctx.createLinearGradient(0, 0, W, H);
        gradient.addColorStop(0, "#766eb4");
        gradient.addColorStop(0.55, "#625b9f");
        gradient.addColorStop(1, "#504a88");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.065)";
        ctx.lineWidth = 1;
        for (let x = 20; x < W; x += 46) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 20; y < H; y += 46) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }

        for (const star of stars) {
            const pulse = 0.75 + Math.sin(time * 0.0012 + star.x) * 0.25;
            ctx.globalAlpha = star.alpha * pulse;
            ctx.fillStyle = "#fff7d6";
            ctx.fillRect(star.x, star.y, star.size, star.size);
        }
        ctx.globalAlpha = 1;

        const glow = ctx.createRadialGradient(W / 2, 180, 10, W / 2, 180, 430);
        glow.addColorStop(0, "rgba(255, 143, 186, 0.13)");
        glow.addColorStop(1, "rgba(255, 143, 186, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);
    }

    function drawArenaInfo() {
        ctx.font = "800 10px Nunito, sans-serif";
        ctx.letterSpacing = "1px";
        ctx.fillStyle = "rgba(255, 255, 255, .68)";
        ctx.textAlign = "left";
        ctx.fillText(`NÍVEL ${String(level).padStart(2, "0")}`, 45, 43);
        if (combo >= 2 && state === "playing") {
            ctx.textAlign = "center";
            ctx.fillStyle = combo >= 6 ? "#ffd66b" : "#aef4df";
            ctx.font = "700 12px Fredoka, sans-serif";
            ctx.fillText(`COMBO ×${combo}`, W / 2, 43);
        }
    }

    function drawBricks() {
        for (const brick of bricks) {
            if (!brick.alive) continue;
            ctx.save();
            ctx.shadowColor = brick.color;
            ctx.shadowBlur = brick.flash > 0 ? 22 : 8;
            const gradient = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
            gradient.addColorStop(0, brick.flash > 0 ? "#ffffff" : brick.color);
            gradient.addColorStop(1, brick.maxHp > 1 ? "#625990" : `${brick.color}c8`);
            ctx.fillStyle = gradient;
            roundRect(brick.x, brick.y, brick.width, brick.height, 5);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "rgba(255,255,255,.22)";
            ctx.lineWidth = 1;
            ctx.stroke();
            if (brick.maxHp > 1) {
                ctx.fillStyle = "rgba(255,255,255,.65)";
                ctx.fillRect(brick.x + 8, brick.y + 6, brick.width - 16, 2);
            }
            if (brick.power) drawPowerIcon(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.power, 0.72);
            ctx.restore();
        }
    }

    function drawPowerIcon(x, y, type, alpha = 1) {
        const info = POWER_INFO[type];
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#4b3f69";
        ctx.font = "900 12px Nunito, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(info.icon, x, y + 0.5);
        ctx.restore();
    }

    function drawDrops() {
        for (const drop of drops) {
            const info = POWER_INFO[drop.type];
            ctx.save();
            ctx.translate(drop.x, drop.y);
            ctx.rotate(Math.sin(drop.rotation) * 0.12);
            ctx.shadowColor = info.color;
            ctx.shadowBlur = 18;
            ctx.fillStyle = "#fff8fd";
            ctx.strokeStyle = info.color;
            ctx.lineWidth = 2;
            roundRect(-17, -14, 34, 28, 8);
            ctx.fill(); ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.fillStyle = info.color;
            ctx.font = "900 15px Nunito, sans-serif";
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(info.icon, 0, 0);
            ctx.restore();
        }
    }

    function drawPlayer() {
        ctx.save();
        ctx.shadowColor = activePower.wide > 0 ? "#ffd66b" : "#ff8fba";
        ctx.shadowBlur = 23;
        const gradient = ctx.createLinearGradient(player.x, 0, player.x + player.width, 0);
        gradient.addColorStop(0, "#ff8fba"); gradient.addColorStop(0.5, "#ffd66b"); gradient.addColorStop(1, "#73e0c1");
        ctx.fillStyle = gradient;
        roundRect(player.x, player.y, player.width, player.height, 7);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,255,255,.8)";
        roundRect(player.x + 18, player.y + 2, player.width - 36, 2, 1);
        ctx.fill();
        ctx.restore();
    }

    function drawBalls() {
        for (const ball of balls) {
            ball.trail.forEach((point, index) => {
                ctx.beginPath();
                ctx.globalAlpha = (1 - index / ball.trail.length) * 0.22;
                ctx.fillStyle = activePower.slow > 0 ? "#c5b2ff" : "#ffd0e1";
                ctx.arc(point.x, point.y, Math.max(1, ball.radius - index * 0.8), 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;
            ctx.save();
            ctx.shadowColor = activePower.slow > 0 ? "#c5b2ff" : "#ffd0e1";
            ctx.shadowBlur = 22;
            const gradient = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, ball.radius);
            gradient.addColorStop(0, "#ffffff"); gradient.addColorStop(0.55, "#fff8fc"); gradient.addColorStop(1, "#ffd0e1");
            ctx.fillStyle = gradient;
            ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    }

    function drawParticles() {
        for (const particle of particles) {
            ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
            ctx.fillStyle = particle.color;
            ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        }
        ctx.globalAlpha = 1;
    }

    function render(time) {
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        if (shake > 0 && state === "playing") ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        drawBackground(time);
        drawArenaInfo();
        drawBricks();
        drawDrops();
        drawPlayer();
        drawBalls();
        drawParticles();
        ctx.restore();
    }

    function ensureAudio() {
        if (!audioContext) {
            const AudioCtor = window.AudioContext || window.webkitAudioContext;
            if (AudioCtor) audioContext = new AudioCtor();
        }
        if (audioContext?.state === "suspended") audioContext.resume();
    }

    function tone(frequency, duration, type = "sine", volume = 0.025, delay = 0) {
        if (!soundEnabled) return;
        ensureAudio();
        if (!audioContext) return;
        const start = audioContext.currentTime + delay;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        oscillator.connect(gain); gain.connect(audioContext.destination);
        oscillator.start(start); oscillator.stop(start + duration + 0.02);
    }

    function setPointerFromEvent(event) {
        const rect = canvas.getBoundingClientRect();
        pointer.x = (event.clientX - rect.left) / rect.width * W;
        pointer.active = true;
    }

    function setTouchControl(button, direction) {
        const down = event => {
            event.preventDefault();
            keys[direction] = true;
            pointer.active = false;
            button.setPointerCapture?.(event.pointerId);
        };
        const up = event => {
            event.preventDefault();
            keys[direction] = false;
        };
        button.addEventListener("pointerdown", down);
        button.addEventListener("pointerup", up);
        button.addEventListener("pointercancel", up);
        button.addEventListener("pointerleave", up);
    }

    document.addEventListener("keydown", event => {
        const key = event.key.toLowerCase();
        if (["arrowleft", "arrowright", "a", "d", "p", "escape", " "].includes(key)) event.preventDefault();
        if (key === "arrowleft" || key === "a") { keys.left = true; pointer.active = false; }
        if (key === "arrowright" || key === "d") { keys.right = true; pointer.active = false; }
        if ((key === "p" || key === "escape") && !event.repeat) togglePause();
        if (key === " " && !event.repeat) {
            if (state === "menu" || state === "gameover") startNewGame();
            else if (state === "levelclear") startNextLevel();
            else if (state === "paused") resumeGame();
        }
    });

    document.addEventListener("keyup", event => {
        const key = event.key.toLowerCase();
        if (key === "arrowleft" || key === "a") keys.left = false;
        if (key === "arrowright" || key === "d") keys.right = false;
    });

    elements.stage.addEventListener("pointermove", setPointerFromEvent);
    elements.stage.addEventListener("pointerdown", setPointerFromEvent);
    elements.stage.addEventListener("pointerleave", () => { pointer.active = false; });
    elements.startButton.addEventListener("click", startNewGame);
    elements.resumeButton.addEventListener("click", resumeGame);
    elements.pauseButton.addEventListener("click", togglePause);
    elements.restartButton.addEventListener("click", () => endMode === "levelclear" ? startNextLevel() : startNewGame());
    elements.soundButton.addEventListener("click", () => {
        soundEnabled = !soundEnabled;
        elements.soundButton.setAttribute("aria-pressed", String(soundEnabled));
        elements.soundButton.setAttribute("aria-label", soundEnabled ? "Desativar som" : "Ativar som");
        elements.soundButton.dataset.tooltip = soundEnabled ? "Som ligado" : "Som desligado";
        elements.soundIcon.textContent = soundEnabled ? "♪" : "×";
        if (soundEnabled) tone(660, 0.07, "sine", 0.03);
    });
    elements.fullscreenButton.addEventListener("click", async () => {
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else await elements.shell.requestFullscreen();
        } catch {
            showStatus("!", "Tela cheia indisponível", "#ffd66b");
        }
    });
    document.addEventListener("fullscreenchange", () => {
        const isFullscreen = Boolean(document.fullscreenElement);
        elements.fullscreenButton.setAttribute("aria-label", isFullscreen ? "Sair da tela cheia" : "Abrir em tela cheia");
        elements.fullscreenButton.dataset.tooltip = isFullscreen ? "Sair da tela cheia" : "Tela cheia";
        elements.fullscreenIcon.textContent = isFullscreen ? "↙" : "⛶";
        fitCanvas();
    });
    setTouchControl(elements.leftButton, "left");
    setTouchControl(elements.rightButton, "right");

    document.addEventListener("visibilitychange", () => {
        if (document.hidden && (state === "playing" || state === "countdown")) pauseGame();
    });
    window.addEventListener("blur", () => {
        keys.left = false; keys.right = false;
    });
    window.addEventListener("resize", fitCanvas);

    function gameLoop(now) {
        const dt = Math.min((now - lastTime) / 1000, 0.033);
        lastTime = now;
        if (state === "countdown") updateCountdown(dt);
        else if (state === "playing") updateGame(dt);
        updateEffects(dt);
        render(now);
        requestAnimationFrame(gameLoop);
    }

    fitCanvas();
    createBricks();
    resetPlayer();
    resetBalls();
    refreshHud();
    setScreen("start");
    requestAnimationFrame(gameLoop);
});
