export class DinoGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error("DinoGame: Canvas not found!");
            return;
        }
        this.ctx = this.canvas.getContext('2d');

        // Game State
        this.isPlaying = false;
        this.gameOver = false;
        this.score = 0;
        this.highScore = 0;
        this.gameSpeed = 5;
        this.animationId = null;

        // Entities
        this.player = {
            x: 50,
            y: 0, // Will be set in resize
            width: 30,
            height: 30,
            dy: 0,
            jumpForce: 12,
            grounded: true,
            color: '#00f0ff'
        };

        this.obstacles = [];
        this.particles = [];
        this.spawnTimer = 0;
        this.bgOffset = 0;

        // Input
        this.handleInput = this.jump.bind(this);
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault(); // Prevent scrolling
                this.handleInput();
            }
        });
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleInput();
        });
        this.canvas.addEventListener('mousedown', (e) => {
            this.handleInput();
        });

        // Resize
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        // Parent wrapper determines size
        const wrapper = this.canvas.parentElement;
        this.canvas.width = wrapper.clientWidth;
        this.canvas.height = wrapper.clientHeight;

        this.groundY = this.canvas.height - 40;
        if (this.player.y === 0 || this.player.grounded) {
            this.player.y = this.groundY - this.player.height;
        }
    }

    start() {
        if (this.isPlaying) return;
        this.reset();
        this.isPlaying = true;
        this.gameOver = false;

        // Hide start screens
        document.getElementById('game-start-screen').classList.add('fade-out');
        document.getElementById('game-over-screen').style.display = 'none';

        this.lastTime = performance.now();
        this.animate(this.lastTime);
    }

    stop() {
        this.isPlaying = false;
        cancelAnimationFrame(this.animationId);
    }

    reset() {
        this.score = 0;
        this.gameSpeed = 5;
        this.spawnTimer = 0;
        this.obstacles = [];
        this.particles = [];
        this.player.y = this.groundY - this.player.height;
        this.player.dy = 0;

        // Update UI
        document.getElementById('game-score').innerText = '0';
    }

    jump() {
        if (!this.isPlaying) {
            if (this.gameOver) {
                // Restart logic handled by button, but space can trigger too
                // document.getElementById('restart-btn').click();
            } else {
                this.start();
            }
            return;
        }

        if (this.player.grounded) {
            this.player.dy = -this.player.jumpForce;
            this.player.grounded = false;
            this.createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height, 5, '#00f0ff');
        }
    }

    update(deltaTime) {
        this.score++;
        if (this.score % 100 === 0) {
            this.gameSpeed += 0.2; // Increase speed
        }
        document.getElementById('game-score').innerText = Math.floor(this.score / 5);

        // Player Physics
        this.player.dy += 0.6; // Gravity
        this.player.y += this.player.dy;

        // Ground Collision
        if (this.player.y + this.player.height > this.groundY) {
            this.player.y = this.groundY - this.player.height;
            this.player.dy = 0;
            this.player.grounded = true;
        }

        // Obstacle Spawner (Random Intervals based on speed)
        this.spawnTimer--;
        if (this.spawnTimer <= 0) {
            this.spawnObstacle();
            // Reset timer: range 60-120 frames, scaled by speed
            this.spawnTimer = Math.floor(Math.random() * (120 - this.gameSpeed * 2) + 60);
            if (this.spawnTimer < 40) this.spawnTimer = 40;
        }

        // Update Obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            let obs = this.obstacles[i];
            obs.x -= this.gameSpeed;

            // Collision Detection (AABB)
            if (
                this.player.x < obs.x + obs.width &&
                this.player.x + this.player.width > obs.x &&
                this.player.y < obs.y + obs.height &&
                this.player.y + this.player.height > obs.y
            ) {
                this.handleGameOver();
            }

            // Remove off-screen
            if (obs.x + obs.width < 0) {
                this.obstacles.splice(i, 1);
            }
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw() {
        // Clear
        this.ctx.fillStyle = '#0a0a0a'; // Black BG
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Grid Floor (Cyberpunk style)
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 1;
        this.bgOffset = (this.bgOffset - this.gameSpeed) % 40;

        // Vertical lines moving
        for (let x = this.bgOffset; x < this.canvas.width; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.groundY);
            this.ctx.lineTo(x - 100, this.canvas.height); // Perspective slant
            this.ctx.stroke();
        }

        // Ground Line
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY);
        this.ctx.lineTo(this.canvas.width, this.groundY);
        this.ctx.strokeStyle = '#00f0ff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw Player (Neon Box)
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = this.player.color;
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        this.ctx.shadowBlur = 0;

        // Draw Obstacles (Red/Orange Spikes)
        this.ctx.fillStyle = '#ff003c';
        this.obstacles.forEach(obs => {
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#ff003c';
            this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            this.ctx.shadowBlur = 0;
        });

        // Draw Particles
        this.ctx.fillStyle = '#fff';
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
            this.ctx.globalAlpha = 1.0;
        });
    }

    animate(time) {
        if (!this.isPlaying) return;

        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        this.update(deltaTime);
        this.draw();

        this.animationId = requestAnimationFrame(this.animate.bind(this));
    }

    spawnObstacle() {
        const height = Math.random() > 0.5 ? 40 : 25; // Random sizes
        const width = 25;
        this.obstacles.push({
            x: this.canvas.width,
            y: this.groundY - height,
            width: width,
            height: height
        });
    }

    createExplosion(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 1) * 5,
                life: 1.0,
                size: Math.random() * 3,
                color: color
            });
        }
    }

    handleGameOver() {
        this.isPlaying = false;
        this.gameOver = true;
        cancelAnimationFrame(this.animationId);

        // Show Game Over Screen
        const goScreen = document.getElementById('game-over-screen');
        goScreen.style.display = 'flex';
        goScreen.classList.remove('fade-out');
        document.getElementById('final-score').innerText = Math.floor(this.score / 5);

        this.createExplosion(this.player.x, this.player.y, 20, '#ff003c');
        this.draw(); // Draw final frame with explosion
    }
}
