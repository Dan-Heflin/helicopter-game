// ============================================================
// HELICOPTER ADVENTURE V2 - Complete Visual & UX Overhaul
// ============================================================

// --- Utility: Color helpers ---
function hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

// --- Particle Classes ---
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 4 + 3;
        this.speedX = -1;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = 0.8;
        this.color = color || '200, 200, 200';
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.opacity -= 0.008;
        this.size -= 0.03;
    }

    draw(ctx) {
        if (this.opacity <= 0 || this.size <= 0) return;
        ctx.save();
        ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
        ctx.shadowColor = `rgba(${this.color}, ${this.opacity * 0.5})`;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ExplosionParticle {
    constructor(x, y, angle, speed) {
        this.x = x;
        this.y = y;
        this.speedX = Math.cos(angle) * speed;
        this.speedY = Math.sin(angle) * speed;
        this.size = 4 + Math.random() * 6;
        this.opacity = 1;
        this.gravity = 0.15;
        this.hue = 20 + Math.random() * 30; // orange to yellow
        this.lightness = 50 + Math.random() * 30;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.speedX *= 0.99;
        this.opacity -= 0.018;
        this.size *= 0.96;
    }

    draw(ctx) {
        if (this.opacity <= 0 || this.size <= 0) return;
        ctx.save();
        const [r, g, b] = hslToRgb(this.hue, 100, this.lightness);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity})`;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${this.opacity * 0.6})`;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ScorePopup {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color || '#00ffaa';
        this.opacity = 1;
        this.scale = 0.5;
        this.vy = -1.5;
    }

    update() {
        this.y += this.vy;
        this.vy *= 0.98;
        this.opacity -= 0.02;
        if (this.scale < 1) this.scale += 0.05;
    }

    draw(ctx) {
        if (this.opacity <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.font = `bold ${Math.round(18 * this.scale)}px 'Orbitron', sans-serif`;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

// --- Gem (Collectible) ---
class Gem {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 10;
        this.collected = false;
        this.angle = Math.random() * Math.PI * 2;
        this.bobSpeed = 0.05 + Math.random() * 0.02;
        this.sparkleTimer = 0;
        this.baseY = y;
    }

    update(scrollSpeed) {
        this.x -= scrollSpeed;
        this.angle += this.bobSpeed;
        this.y = this.baseY + Math.sin(this.angle) * 6;
        this.sparkleTimer++;
    }

    draw(ctx) {
        if (this.collected) return;
        ctx.save();
        const glow = 0.6 + Math.sin(this.sparkleTimer * 0.1) * 0.4;
        // Outer glow
        ctx.shadowColor = `rgba(0, 255, 200, ${glow})`;
        ctx.shadowBlur = 15;
        // Diamond shape
        ctx.fillStyle = `rgba(0, 255, 180, ${0.7 + glow * 0.3})`;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size);
        ctx.lineTo(this.x + this.size * 0.6, this.y);
        ctx.lineTo(this.x, this.y + this.size * 0.7);
        ctx.lineTo(this.x - this.size * 0.6, this.y);
        ctx.closePath();
        ctx.fill();
        // Inner highlight
        ctx.fillStyle = `rgba(200, 255, 240, ${0.5 + glow * 0.3})`;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size * 0.5);
        ctx.lineTo(this.x + this.size * 0.25, this.y);
        ctx.lineTo(this.x, this.y + this.size * 0.3);
        ctx.lineTo(this.x - this.size * 0.25, this.y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    collidesWith(helicopter) {
        if (this.collected) return false;
        const dx = this.x - (helicopter.x + helicopter.width / 2);
        const dy = this.y - (helicopter.y + helicopter.height / 2);
        return Math.sqrt(dx * dx + dy * dy) < this.size + 20;
    }
}

// --- Helicopter ---
class Helicopter {
    constructor(x, y, canvas, gameAudio) {
        this.x = x;
        this.y = y;
        this.canvas = canvas;
        this.gameAudio = gameAudio;
        this.velocity = 0;
        this.gravity = 0.25;
        this.liftForce = -5;
        this.maxLiftVelocity = 4;
        this.maxFallVelocity = 6;
        this.width = 50;
        this.height = 20;
        this.bodyColor = '#4682B4';
        this.accentColor = '#FFD700';
        this.rotorColor = '#1A1A1A';
        this.rotorSpeed = 0.5;
        this.rotorAngle = 0;
        this.type = 'scout';
        this.isLifting = false;
        this.particles = [];
        this.particleTimer = 0;
        this.liftSound = null;
        this.trailPoints = [];
        this.verticalOffset = 0;
    }

    update() {
        if (this.isLifting) {
            this.velocity += this.liftForce * 0.2;
            if (this.velocity < -this.maxLiftVelocity) {
                this.velocity = -this.maxLiftVelocity;
            }
        }
        this.velocity += this.gravity;
        if (this.velocity > this.maxFallVelocity) {
            this.velocity = this.maxFallVelocity;
        }
        this.y += this.velocity;

        const effectiveHeight = this.height + (this.verticalOffset || 0);
        if (this.y > this.canvas.height - effectiveHeight) {
            this.y = this.canvas.height - effectiveHeight;
            this.velocity = 0;
        }
        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }

        // Trail
        this.trailPoints.push({ x: this.x, y: this.y + this.height / 2, opacity: 0.6 });
        if (this.trailPoints.length > 20) this.trailPoints.shift();
        this.trailPoints.forEach(p => { p.opacity -= 0.03; });
        this.trailPoints = this.trailPoints.filter(p => p.opacity > 0);

        // Exhaust particles
        this.particleTimer++;
        if (this.particleTimer > 2) {
            const color = this.isLifting ? '255, 180, 50' : '180, 180, 180';
            this.particles.push(new Particle(this.x - 15, this.y + 15, color));
            this.particleTimer = 0;
        }
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].size <= 0.2 || this.particles[i].opacity <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.save();

        // Draw trail
        if (this.trailPoints.length > 1) {
            for (let i = 1; i < this.trailPoints.length; i++) {
                const p = this.trailPoints[i];
                const prev = this.trailPoints[i - 1];
                ctx.strokeStyle = `rgba(0, 200, 150, ${p.opacity * 0.3})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(prev.x, prev.y);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
            }
        }

        // Draw particles
        this.particles.forEach(particle => particle.draw(ctx));

        // Engine glow when lifting
        if (this.isLifting) {
            ctx.save();
            const glowSize = 12 + Math.random() * 4;
            const gradient = ctx.createRadialGradient(
                this.x - 10, this.y + this.height / 2, 0,
                this.x - 10, this.y + this.height / 2, glowSize
            );
            gradient.addColorStop(0, 'rgba(255, 200, 50, 0.6)');
            gradient.addColorStop(0.5, 'rgba(255, 120, 20, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 80, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x - 10, this.y + this.height / 2, glowSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        if (this.type === 'scout') {
            this.drawScout(ctx);
        } else if (this.type === 'tanker') {
            this.drawTanker(ctx);
        }

        ctx.restore();
    }

    drawScout(ctx) {
        // Main body with gradient
        const bodyGrad = ctx.createLinearGradient(this.x - 5, this.y, this.x + 40, this.y + this.height);
        bodyGrad.addColorStop(0, '#5a9fd4');
        bodyGrad.addColorStop(1, '#2a5f8f');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(this.x + 40, this.y + this.height / 2);
        ctx.quadraticCurveTo(this.x + 45, this.y + this.height / 2, this.x + 42, this.y + this.height / 2 + 4);
        ctx.lineTo(this.x + 10, this.y + this.height - 2);
        ctx.lineTo(this.x - 5, this.y + this.height / 2 + 2);
        ctx.lineTo(this.x - 5, this.y + this.height / 2 - 2);
        ctx.lineTo(this.x + 10, this.y + 2);
        ctx.closePath();
        ctx.fill();

        // Tail boom
        ctx.fillStyle = bodyGrad;
        ctx.fillRect(this.x - 20, this.y + this.height / 2 - 1.5, 18, 3);

        // Tail fin
        ctx.beginPath();
        ctx.moveTo(this.x - 20, this.y + this.height / 2 - 6);
        ctx.lineTo(this.x - 20, this.y + this.height / 2 + 6);
        ctx.lineTo(this.x - 23, this.y + this.height / 2);
        ctx.closePath();
        ctx.fill();

        // Tail rotor
        ctx.save();
        ctx.translate(this.x - 20, this.y + this.height / 2);
        ctx.rotate(Date.now() / 80);
        for (let i = 0; i < 2; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.strokeStyle = `rgba(26, 26, 26, ${0.7 - i * 0.3})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-5, 0);
            ctx.lineTo(5, 0);
            ctx.stroke();
        }
        ctx.restore();

        // Accent stripe with glow
        ctx.strokeStyle = this.accentColor;
        ctx.shadowColor = this.accentColor;
        ctx.shadowBlur = 4;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + 38, this.y + this.height / 2);
        ctx.lineTo(this.x, this.y + this.height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Cockpit window with gradient
        const windowGrad = ctx.createLinearGradient(this.x + 25, this.y + 4, this.x + 25, this.y + this.height - 4);
        windowGrad.addColorStop(0, 'rgba(135, 220, 255, 0.9)');
        windowGrad.addColorStop(1, 'rgba(80, 180, 220, 0.6)');
        ctx.fillStyle = windowGrad;
        ctx.beginPath();
        ctx.moveTo(this.x + 35, this.y + this.height / 2);
        ctx.quadraticCurveTo(this.x + 30, this.y + 4, this.x + 20, this.y + 6);
        ctx.lineTo(this.x + 15, this.y + this.height / 2 - 2);
        ctx.quadraticCurveTo(this.x + 25, this.y + this.height - 4, this.x + 35, this.y + this.height / 2);
        ctx.closePath();
        ctx.fill();

        // Landing skids
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + 25, this.y + this.height - 1);
        ctx.lineTo(this.x + 25, this.y + this.height + 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x + 15, this.y + this.height - 1);
        ctx.lineTo(this.x + 15, this.y + this.height + 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x + 25, this.y + this.height + 5);
        ctx.lineTo(this.x + 5, this.y + this.height + 5);
        ctx.stroke();

        // Main rotor
        this.rotorAngle += this.rotorSpeed;
        ctx.save();
        ctx.translate(this.x + 15, this.y + 2);
        ctx.rotate(this.rotorAngle);
        for (let i = 0; i < 2; i++) {
            ctx.rotate(Math.PI);
            ctx.strokeStyle = `rgba(26, 26, 26, ${0.7 - i * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(this.width / 2, 0);
            ctx.stroke();
        }
        ctx.fillStyle = this.rotorColor;
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawTanker(ctx) {
        const offsetY = this.y + (this.verticalOffset || 0);

        // Body with gradient
        const bodyGrad = ctx.createLinearGradient(this.x - 15, offsetY, this.x + 30, offsetY + 20);
        bodyGrad.addColorStop(0, '#6d4c3a');
        bodyGrad.addColorStop(1, '#3d2517');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.rect(this.x - 15, offsetY + this.height / 2 - 10, 45, 20);
        ctx.fill();

        // Nose
        ctx.beginPath();
        ctx.moveTo(this.x + 30, offsetY + this.height / 2 - 5);
        ctx.lineTo(this.x + 35, offsetY + this.height / 2);
        ctx.lineTo(this.x + 30, offsetY + this.height / 2 + 5);
        ctx.lineTo(this.x + 25, offsetY + this.height / 2 + 5);
        ctx.lineTo(this.x + 25, offsetY + this.height / 2 - 5);
        ctx.closePath();
        ctx.fill();

        // Cargo compartment
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.rect(this.x - 10, offsetY + this.height / 2 - 20, 30, 10);
        ctx.fill();

        // Detail panels
        ctx.strokeStyle = '#4D352F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x - 10, offsetY + this.height / 2 - 15);
        ctx.lineTo(this.x + 20, offsetY + this.height / 2 - 15);
        ctx.stroke();
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(this.x - 5 + i * 10, offsetY + this.height / 2 - 20);
            ctx.lineTo(this.x - 5 + i * 10, offsetY + this.height / 2 - 10);
            ctx.stroke();
        }

        // Cockpit
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.rect(this.x + 20, offsetY + this.height / 2 - 8, 14, 16);
        ctx.fill();

        // Window
        ctx.fillStyle = 'rgba(135, 206, 235, 0.7)';
        ctx.beginPath();
        ctx.moveTo(this.x + 22, offsetY + this.height / 2 - 6);
        ctx.lineTo(this.x + 32, offsetY + this.height / 2 - 6);
        ctx.lineTo(this.x + 32, offsetY + this.height / 2 + 6);
        ctx.lineTo(this.x + 22, offsetY + this.height / 2 + 6);
        ctx.closePath();
        ctx.fill();

        // Tail section
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(this.x - 15, offsetY + this.height / 2 - 5);
        ctx.lineTo(this.x - 45, offsetY + this.height / 2 - 8);
        ctx.lineTo(this.x - 45, offsetY + this.height / 2 + 8);
        ctx.lineTo(this.x - 15, offsetY + this.height / 2 + 5);
        ctx.closePath();
        ctx.fill();

        // Vertical stabilizer
        ctx.beginPath();
        ctx.moveTo(this.x - 40, offsetY + this.height / 2 - 8);
        ctx.lineTo(this.x - 40, offsetY + this.height / 2 - 20);
        ctx.lineTo(this.x - 35, offsetY + this.height / 2 - 20);
        ctx.lineTo(this.x - 35, offsetY + this.height / 2 - 8);
        ctx.closePath();
        ctx.fill();

        // Tail rotor housing
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.rect(this.x - 52, offsetY + this.height / 2 - 7, 7, 14);
        ctx.fill();
        ctx.save();
        ctx.translate(this.x - 48, offsetY + this.height / 2);
        ctx.rotate(Date.now() / 120);
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 2; i++) {
            ctx.rotate(Math.PI);
            ctx.beginPath();
            ctx.moveTo(0, -4);
            ctx.lineTo(0, 4);
            ctx.stroke();
        }
        ctx.restore();

        // Warning stripes with glow
        ctx.fillStyle = this.accentColor;
        ctx.shadowColor = this.accentColor;
        ctx.shadowBlur = 3;
        for (let i = 0; i < 3; i++) {
            if (i % 2 === 0) {
                ctx.fillRect(this.x - 35 + i * 7, offsetY + this.height / 2 - 2, 7, 4);
            }
        }
        ctx.fillRect(this.x + 25, offsetY + this.height / 2 - 3, 7, 2);
        ctx.shadowBlur = 0;

        // Insignia
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.x, offsetY + this.height / 2 - 15, 3, 0, Math.PI * 2);
        ctx.fill();

        // Landing gear
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x + 20, offsetY + this.height / 2 + 10);
        ctx.lineTo(this.x + 20, offsetY + this.height / 2 + 17);
        ctx.lineTo(this.x + 5, offsetY + this.height / 2 + 17);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x + 18, offsetY + this.height / 2 + 10);
        ctx.lineTo(this.x + 16, offsetY + this.height / 2 + 14);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x - 10, offsetY + this.height / 2 + 10);
        ctx.lineTo(this.x - 10, offsetY + this.height / 2 + 17);
        ctx.lineTo(this.x - 25, offsetY + this.height / 2 + 17);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x - 12, offsetY + this.height / 2 + 10);
        ctx.lineTo(this.x - 14, offsetY + this.height / 2 + 14);
        ctx.stroke();

        // Main rotor
        this.rotorAngle += this.rotorSpeed * 0.8;
        ctx.save();
        ctx.translate(this.x + 5, offsetY + this.height / 2 - 20);
        ctx.fillStyle = '#333333';
        ctx.fillRect(-3, -8, 6, 8);
        ctx.fillRect(-6, -2, 12, 4);
        for (let i = 0; i < 2; i++) {
            ctx.save();
            ctx.rotate(this.rotorAngle + i * Math.PI);
            ctx.fillStyle = '#333333';
            ctx.beginPath();
            ctx.moveTo(-3, 0);
            ctx.lineTo(-this.width / 2 - 5, -2);
            ctx.lineTo(-this.width / 2 - 5, 2);
            ctx.lineTo(3, 0);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(3, 0);
            ctx.lineTo(this.width / 2 + 5, -2);
            ctx.lineTo(this.width / 2 + 5, 2);
            ctx.lineTo(-3, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    }

    drawBody(ctx) {
        if (this.type === 'scout') {
            ctx.fillStyle = this.bodyColor;
            ctx.beginPath();
            ctx.ellipse(0, 0, 15, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ADD8E6';
            ctx.beginPath();
            ctx.ellipse(5, -2, 7, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = this.bodyColor;
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(-25, -5);
            ctx.lineTo(-25, 5);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(15, 10); ctx.lineTo(15, 14); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(5, 10); ctx.lineTo(5, 14); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(15, 14); ctx.lineTo(-5, 14); ctx.stroke();
        } else if (this.type === 'tanker') {
            ctx.translate(0, this.verticalOffset || 0);
            ctx.fillStyle = this.bodyColor;
            ctx.fillRect(-15, -10, 40, 20);
            ctx.beginPath();
            ctx.moveTo(25, -5); ctx.lineTo(30, 0); ctx.lineTo(25, 5); ctx.lineTo(20, 5); ctx.lineTo(20, -5);
            ctx.closePath(); ctx.fill();
            ctx.fillRect(-10, -20, 30, 10);
            ctx.fillStyle = 'rgba(135, 206, 235, 0.7)';
            ctx.fillRect(18, -6, 10, 12);
            ctx.fillStyle = this.bodyColor;
            ctx.beginPath();
            ctx.moveTo(-15, -5); ctx.lineTo(-35, -8); ctx.lineTo(-35, 8); ctx.lineTo(-15, 5);
            ctx.closePath(); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-30, -8); ctx.lineTo(-30, -18); ctx.lineTo(-25, -18); ctx.lineTo(-25, -8);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = this.accentColor;
            ctx.fillRect(-25, -2, 5, 4);
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath(); ctx.arc(0, -15, 3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.arc(0, -8, 2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-20, -8); ctx.lineTo(20, -8); ctx.stroke();
    }

    lift() {
        this.isLifting = true;
        if (!this.liftSound && this.gameAudio) {
            this.liftSound = this.gameAudio.play('helicopter', true, this.type);
        }
    }

    stopLift() {
        this.isLifting = false;
        if (this.liftSound && this.gameAudio) {
            this.gameAudio.stopSound(this.liftSound);
            this.liftSound = null;
        }
    }

    setType(type) {
        this.type = type;
        if (type === 'scout') {
            this.bodyColor = '#4682B4';
            this.accentColor = '#FFD700';
            this.gravity = 0.20;
            this.liftForce = -4;
            this.maxLiftVelocity = 4;
            this.width = 50;
            this.height = 20;
            this.verticalOffset = 0;
        } else if (type === 'tanker') {
            this.bodyColor = '#5D4037';
            this.accentColor = '#FF6F00';
            this.gravity = 0.35;
            this.liftForce = -3;
            this.maxLiftVelocity = 7;
            this.width = 70;
            this.height = 30;
            this.verticalOffset = -6;
        }
    }
}

// --- Obstacle ---
class Obstacle {
    constructor(canvas, score, isMobile, previousObstacle = null) {
        this.canvas = canvas;
        this.width = 100 + Math.random() * 60;
        this.x = canvas.width;
        this.isMobile = isMobile;

        const difficultyLevel = Math.floor(score / 250);
        const baseMinGap = isMobile ? 190 : 130;
        const baseMaxGap = isMobile ? 240 : 180;
        const gapReduction = Math.min(difficultyLevel * 30, 40);

        let minGap = Math.max(baseMinGap - gapReduction, isMobile ? 80 : 40);
        let maxGap = Math.max(baseMaxGap - gapReduction, isMobile ? 110 : 70);

        if (score > 1000) {
            minGap = Math.floor(minGap * (isMobile ? 0.7 : 0.5));
            maxGap = Math.floor(maxGap * (isMobile ? 0.7 : 0.5));
        }

        this.gap = minGap + Math.random() * (maxGap - minGap);

        const safeZone = 80;
        const playableHeight = canvas.height - (2 * safeZone);
        const sectionHeight = playableHeight / 3;
        const section = Math.floor(Math.random() * 3);
        const sectionStart = safeZone + (section * sectionHeight);
        const sectionEnd = sectionStart + sectionHeight - this.gap;
        this.gapPosition = sectionStart + Math.random() * (sectionEnd - sectionStart);

        this.topPoints = this.generateJaggedPoints(true);
        this.bottomPoints = this.generateJaggedPoints(false);
    }

    generateJaggedPoints(isTop) {
        const points = [];
        const segments = 8;
        const segmentWidth = this.width / segments;
        const minObstacleHeight = this.isMobile ? 60 : 30;

        for (let i = 0; i <= segments; i++) {
            const x = this.x + (i * segmentWidth);
            const maxExtend = isTop ?
                (this.gapPosition - 20) :
                (this.canvas.height - (this.gapPosition + this.gap) - 20);
            const minHeight = maxExtend * 0.4;

            let taperFactor = 1;
            if (i <= 1) taperFactor = i / 1;
            if (i >= segments - 1) taperFactor = (segments - i) / 1;

            let calculatedHeight = (minHeight + (maxExtend - minHeight) * Math.random()) * taperFactor;
            calculatedHeight = Math.max(calculatedHeight, minObstacleHeight * taperFactor);

            let y;
            if (!isTop) {
                y = this.canvas.height - calculatedHeight;
            } else {
                y = calculatedHeight;
            }

            if (i > 0) {
                const prevX = points[points.length - 1].x;
                const prevY = points[points.length - 1].y;
                const midX = (prevX + x) / 2;
                const variance = 15;
                const midY = (prevY + y) / 2 + (Math.random() - 0.5) * variance;
                points.push({ x: midX, y: midY });
            }
            points.push({ x, y });
        }
        return points;
    }

    update(scrollSpeed) {
        this.x -= scrollSpeed;
        this.topPoints.forEach(point => { point.x -= scrollSpeed; });
        this.bottomPoints.forEach(point => { point.x -= scrollSpeed; });
    }

    draw(ctx) {
        // Top formation with gradient and glow
        const topGrad = ctx.createLinearGradient(0, 0, 0, this.gapPosition);
        topGrad.addColorStop(0, '#0d3320');
        topGrad.addColorStop(0.7, '#1a6b42');
        topGrad.addColorStop(1, '#22c070');
        ctx.fillStyle = topGrad;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 220, 130, 0.4)';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.moveTo(this.topPoints[0].x, 0);
        for (let i = 0; i < this.topPoints.length; i++) {
            const point = this.topPoints[i];
            if (i === 0) {
                ctx.lineTo(point.x, point.y);
            } else {
                const prevPoint = this.topPoints[i - 1];
                const cpX = (prevPoint.x + point.x) / 2;
                ctx.quadraticCurveTo(cpX, prevPoint.y, point.x, point.y);
            }
        }
        ctx.lineTo(this.topPoints[this.topPoints.length - 1].x, 0);
        ctx.fill();
        ctx.restore();

        // Bottom formation with gradient and glow
        const bottomGrad = ctx.createLinearGradient(0, this.gapPosition + this.gap, 0, this.canvas.height);
        bottomGrad.addColorStop(0, '#22c070');
        bottomGrad.addColorStop(0.3, '#1a6b42');
        bottomGrad.addColorStop(1, '#0d3320');
        ctx.fillStyle = bottomGrad;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 220, 130, 0.4)';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.moveTo(this.bottomPoints[0].x, this.canvas.height);
        for (let i = 0; i < this.bottomPoints.length; i++) {
            const point = this.bottomPoints[i];
            if (i === 0) {
                ctx.lineTo(point.x, point.y);
            } else {
                const prevPoint = this.bottomPoints[i - 1];
                const cpX = (prevPoint.x + point.x) / 2;
                ctx.quadraticCurveTo(cpX, prevPoint.y, point.x, point.y);
            }
        }
        ctx.lineTo(this.bottomPoints[this.bottomPoints.length - 1].x, this.canvas.height);
        ctx.fill();
        ctx.restore();
    }

    collidesWith(helicopter) {
        const hx = helicopter.x;
        const hy = helicopter.y;
        const hw = helicopter.width;
        const hh = helicopter.height;

        if (hx + hw < this.x || hx > this.x + this.width) return false;

        const segments = this.topPoints.length - 1;
        const segmentWidth = this.width / segments;
        const relativeX = hx - this.x;
        const segment = Math.min(Math.floor(relativeX / segmentWidth), segments - 1);
        if (segment < 0) return false;

        const topY = this.interpolateY(this.topPoints[segment], this.topPoints[segment + 1], hx);
        const bottomY = this.interpolateY(this.bottomPoints[segment], this.bottomPoints[segment + 1], hx);

        return hy < topY || (hy + hh) > bottomY;
    }

    interpolateY(p1, p2, x) {
        const ratio = (x - p1.x) / (p2.x - p1.x);
        return p1.y + (p2.y - p1.y) * ratio;
    }
}

// --- Background & Edge Formations ---
class BackgroundFormation {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = 80 + Math.random() * 120;
        this.x = canvas.width;
        this.height = 60 + Math.random() * 120;
        this.isTop = Math.random() > 0.5;
        this.points = this.generatePoints();
    }

    generatePoints() {
        const points = [];
        const segments = 4 + Math.floor(Math.random() * 3);
        const segmentWidth = this.width / segments;
        for (let i = 0; i <= segments; i++) {
            const x = this.x + (i * segmentWidth);
            let height = this.height * (0.6 + Math.random() * 0.4);
            if (i === 0 || i === segments) height *= 0.2;
            points.push({
                x,
                y: this.isTop ? height : this.canvas.height - height
            });
        }
        return points;
    }

    update(scrollSpeed) {
        this.x -= scrollSpeed * 0.3;
        this.points.forEach(point => { point.x -= scrollSpeed * 0.3; });
    }

    draw(ctx) {
        ctx.fillStyle = '#071a0e';
        ctx.beginPath();
        if (this.isTop) {
            ctx.moveTo(this.points[0].x, 0);
            this.points.forEach((point, i) => {
                if (i === 0) { ctx.lineTo(point.x, point.y); }
                else {
                    const prevPoint = this.points[i - 1];
                    const cpX = (prevPoint.x + point.x) / 2;
                    ctx.quadraticCurveTo(cpX, prevPoint.y, point.x, point.y);
                }
            });
            ctx.lineTo(this.points[this.points.length - 1].x, 0);
        } else {
            ctx.moveTo(this.points[0].x, this.canvas.height);
            this.points.forEach((point, i) => {
                if (i === 0) { ctx.lineTo(point.x, point.y); }
                else {
                    const prevPoint = this.points[i - 1];
                    const cpX = (prevPoint.x + point.x) / 2;
                    ctx.quadraticCurveTo(cpX, prevPoint.y, point.x, point.y);
                }
            });
            ctx.lineTo(this.points[this.points.length - 1].x, this.canvas.height);
        }
        ctx.closePath();
        ctx.fill();
    }
}

class EdgeFormation {
    constructor(canvas, isTop) {
        this.canvas = canvas;
        this.isTop = isTop;
        this.maxHeight = 15;
        this.segments = 20;
        this.segmentWidth = 50;
        this.points = [];
        this.generateInitialPoints();
    }

    generateInitialPoints() {
        const totalSegments = Math.ceil(this.canvas.width / this.segmentWidth) + 2;
        for (let i = 0; i <= totalSegments; i++) {
            const x = i * this.segmentWidth;
            const height = 5 + Math.random() * 10;
            this.points.push({
                x,
                y: this.isTop ? height : this.canvas.height - height
            });
        }
    }

    addNewPoint() {
        const x = this.points[this.points.length - 1].x + this.segmentWidth;
        const height = 5 + Math.random() * 10;
        this.points.push({
            x,
            y: this.isTop ? height : this.canvas.height - height
        });
    }

    update(scrollSpeed) {
        this.points.forEach(point => { point.x -= scrollSpeed; });
        while (this.points.length > 0 && this.points[0].x + this.segmentWidth < 0) {
            this.points.shift();
        }
        while (this.points[this.points.length - 1].x < this.canvas.width + this.segmentWidth) {
            this.addNewPoint();
        }
    }

    draw(ctx) {
        // Edge formations with glow
        const grad = this.isTop
            ? ctx.createLinearGradient(0, 0, 0, 20)
            : ctx.createLinearGradient(0, this.canvas.height - 20, 0, this.canvas.height);

        grad.addColorStop(0, this.isTop ? '#0d3320' : '#1a7a4a');
        grad.addColorStop(1, this.isTop ? '#1a7a4a' : '#0d3320');

        ctx.save();
        ctx.shadowColor = 'rgba(0, 200, 120, 0.3)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = grad;
        ctx.beginPath();

        if (this.isTop) {
            ctx.moveTo(this.points[0].x, 0);
            this.points.forEach((point, i) => {
                if (i === 0) { ctx.lineTo(point.x, point.y); }
                else {
                    const prevPoint = this.points[i - 1];
                    const cpX = (prevPoint.x + point.x) / 2;
                    ctx.quadraticCurveTo(cpX, prevPoint.y, point.x, point.y);
                }
            });
            ctx.lineTo(this.points[this.points.length - 1].x, 0);
        } else {
            ctx.moveTo(this.points[0].x, this.canvas.height);
            this.points.forEach((point, i) => {
                if (i === 0) { ctx.lineTo(point.x, point.y); }
                else {
                    const prevPoint = this.points[i - 1];
                    const cpX = (prevPoint.x + point.x) / 2;
                    ctx.quadraticCurveTo(cpX, prevPoint.y, point.x, point.y);
                }
            });
            ctx.lineTo(this.points[this.points.length - 1].x, this.canvas.height);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

// --- Helipad ---
class Helipad {
    constructor(canvas, offset = 0) {
        this.canvas = canvas;
        this.width = 120;
        this.height = 10;
        this.x = 60 + offset;
        this.y = canvas.height - this.height - 20;
    }

    update(scrollSpeed) {
        this.x -= scrollSpeed;
    }

    draw(ctx) {
        ctx.fillStyle = '#555';
        const frameThickness = 5;
        const frameHeight = 15;
        ctx.fillRect(this.x + 10, this.y + this.height, frameThickness, frameHeight);
        ctx.fillRect(this.x + this.width - 15, this.y + this.height, frameThickness, frameHeight);
        ctx.fillRect(this.x, this.y + this.height + frameHeight, this.width, frameThickness);

        // Main pad with subtle gradient
        const padGrad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        padGrad.addColorStop(0, '#444');
        padGrad.addColorStop(1, '#333');
        ctx.fillStyle = padGrad;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Landing markers with glow
        ctx.save();
        ctx.shadowColor = 'rgba(255, 255, 0, 0.5)';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#FFD700';
        const markerWidth = 10;
        const markerHeight = 5;
        const spacing = 20;
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(
                this.x + 10 + (i * spacing),
                this.y + (this.height - markerHeight) / 2,
                markerWidth,
                markerHeight
            );
        }
        ctx.restore();
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }

    collidesWith(helicopter) {
        return (
            helicopter.x + helicopter.width > this.x &&
            helicopter.x < this.x + this.width &&
            helicopter.y + helicopter.height > this.y &&
            helicopter.y < this.y + this.height
        );
    }
}

// --- GameAudio ---
class GameAudio {
    constructor() {
        this.sounds = {};
        this.isMuted = false;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.audioContext.destination);

        this.crashSound = new Audio('sounds/crash.wav');
        this.crashSound.volume = 0.5;
        this.difficultySound = new Audio('sounds/difficulty-increase.wav');
        this.difficultySound.volume = 0.5;
        this.highScoreSound = new Audio('sounds/highscore.flac');
        this.highScoreSound.volume = 0.5;

        this.soundFiles = {
            helicopter: 'sounds/helicopter-loop.wav',
            heavyHelicopter: 'sounds/heavy-helicopter.wav'
        };

        this.loadSounds();
        this.setupMuteButton();
        this.setupHelicopterButton();
        this.setupVolumeControl();

        document.addEventListener('click', () => this.resumeAudio(), { once: true });
        document.addEventListener('keydown', () => this.resumeAudio(), { once: true });
        document.addEventListener('touchstart', () => this.resumeAudio(), { once: true });
    }

    async resumeAudio() {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        this.crashSound.play().then(() => this.crashSound.pause()).catch(() => {});
        this.difficultySound.play().then(() => this.difficultySound.pause()).catch(() => {});
        this.highScoreSound.play().then(() => this.highScoreSound.pause()).catch(() => {});
    }

    loadSounds() {
        const loadPromises = Object.entries(this.soundFiles).map(async ([key, path]) => {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`Failed to load ${key}: ${response.statusText}`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.sounds[key] = audioBuffer;
        });
        Promise.all(loadPromises).catch((error) => {
            console.error('Error loading sounds:', error);
        });
    }

    play(soundName, loop = false, helicopterType = 'scout') {
        if (this.isMuted) return null;
        if (this.audioContext.state === 'suspended') this.resumeAudio();

        switch (soundName) {
            case 'crash':
                this.crashSound.currentTime = 0;
                this.crashSound.play().catch(e => {
                    this.resumeAudio().then(() => this.crashSound.play());
                });
                return null;
            case 'difficulty':
                this.difficultySound.currentTime = 0;
                this.difficultySound.play().catch(() => {});
                return null;
            case 'highScore':
                this.highScoreSound.currentTime = 0;
                this.highScoreSound.play().catch(() => {});
                return null;
            case 'helicopter':
                const soundKey = helicopterType === 'tanker' ? 'heavyHelicopter' : 'helicopter';
                if (!this.sounds[soundKey]) return null;
                const source = this.audioContext.createBufferSource();
                source.buffer = this.sounds[soundKey];
                source.connect(this.masterGain);
                source.loop = loop;
                source.start(0);
                return source;
        }
    }

    setupMuteButton() {
        const muteButton = document.querySelector('.utility-button[data-action="mute"]');
        if (muteButton) {
            muteButton.onclick = () => {
                this.isMuted = !this.isMuted;
                const volumeSlider = document.getElementById('volumeSlider');
                const volume = volumeSlider ? volumeSlider.value / 100 : 0.5;
                this.masterGain.gain.value = this.isMuted ? 0 : volume;
                if (this.crashSound) this.crashSound.muted = this.isMuted;
                if (this.difficultySound) this.difficultySound.muted = this.isMuted;
                if (this.highScoreSound) this.highScoreSound.muted = this.isMuted;
                muteButton.textContent = this.isMuted ? '🔇' : '🔊';
            };
        }
    }

    setupVolumeControl() {
        const volumeSlider = document.getElementById('volumeSlider');
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.masterGain.gain.value = this.isMuted ? 0 : volume;
            this.crashSound.volume = volume;
            this.difficultySound.volume = volume;
            this.highScoreSound.volume = volume;
        });
    }

    setupHelicopterButton() {
        const helicopterButton = document.querySelector('.utility-button[data-action="helicopter"]');
        const modal = document.getElementById('helicopterModal');
        const closeButton = document.getElementById('closeHelicopterModal');

        if (helicopterButton) {
            helicopterButton.onclick = () => {
                if (modal) {
                    this.populateHelicopterOptions && this.populateHelicopterOptions();
                    modal.style.display = 'flex';
                }
            };
        }
        if (closeButton) {
            closeButton.onclick = () => { if (modal) modal.style.display = 'none'; };
        }
        if (modal) {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) modal.style.display = 'none';
            });
        }
    }

    stopSound(source) {
        if (source) {
            try { source.stop(); } catch (error) {}
        }
    }
}

// --- Main Game Class ---
class Game {
    constructor() {
        this.isMobile = this.detectMobile();
        this.selectedMapType = 'cave';
        this.gameAudio = new GameAudio();

        // Firebase
        const firebaseConfig = {
            apiKey: "AIzaSyCOxjS5m_37mMElI8NzWhIFmhMxeaQ4dkI",
            authDomain: "helicopter-game-d0856.firebaseapp.com",
            databaseURL: "https://helicopter-game-d0856-default-rtdb.firebaseio.com",
            projectId: "helicopter-game-d0856",
            storageBucket: "helicopter-game-d0856.firebasestorage.app",
            messagingSenderId: "864747316887",
            appId: "1:864747316887:web:17f6645e324a9a08a82bd2",
            measurementId: "G-34DGMK4F52"
        };
        firebase.initializeApp(firebaseConfig);
        this.database = firebase.database();
        this.leaderboard = [];

        // Canvas
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.fps = 60;
        this.frameInterval = 1000 / this.fps;
        this.lastTime = 0;

        // Setup canvas size and speeds
        const targetObstacleDistance = this.isMobile ? 550 : 400;
        if (this.isMobile) {
            this.canvas.width = 600;
            this.canvas.height = 600;
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.scrollSpeed = 8;
            this.baseScrollSpeed = 480;
            const desktopScrollSpeed = 9;
            const desktopObstacleInterval = Math.round(targetObstacleDistance / desktopScrollSpeed);
            const desktopPixelDistance = desktopScrollSpeed * desktopObstacleInterval;
            this.obstacleInterval = Math.round(desktopPixelDistance / this.scrollSpeed);
            this.bgFormationInterval = Math.round(this.obstacleInterval / 2);
        } else {
            this.canvas.width = 800;
            this.canvas.height = 400;
            this.scrollSpeed = 9;
            this.baseScrollSpeed = 540;
            this.obstacleInterval = Math.round(targetObstacleDistance / this.scrollSpeed);
            this.bgFormationInterval = Math.round(this.obstacleInterval / 2);
        }

        // Game objects
        this.helicopter = new Helicopter(130, this.canvas.height / 2, this.canvas, this.gameAudio);
        this.selectedHelicopterType = 'scout';
        this.gameState = 'start';
        this.isGameOver = false;
        this.score = 0;
        this.highScore = 0;
        this.obstacles = [];
        this.obstacleTimer = 0;
        this.gems = [];
        this.gemTimer = 0;
        this.scorePopups = [];
        this.isSpaceKeyDown = false;
        this.waitForSpaceRelease = false;

        // Screen shake
        this.shakeAmount = 0;
        this.shakeDuration = 0;

        // Star field
        this.stars = [];
        for (let i = 0; i < 60; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 0.5 + Math.random() * 1.5,
                twinkleSpeed: 0.02 + Math.random() * 0.03,
                twinklePhase: Math.random() * Math.PI * 2
            });
        }

        this.loadLeaderboard();
        this.textColor = '#FFFFFF';

        // Keyboard input
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                this.isSpaceKeyDown = true;
                if (this.gameState === 'start') {
                    this.gameState = 'takeoff';
                    this.helicopter.y = this.canvas.height - 50;
                } else if (this.gameState === 'takeoff') {
                    this.gameState = 'playing';
                    this.helicopter.lift();
                } else if (this.gameState === 'gameover') {
                    if (!this.waitForSpaceRelease) {
                        this.reset();
                        this.gameState = 'takeoff';
                        this.helicopter.y = this.canvas.height - 50;
                    }
                } else {
                    this.helicopter.lift();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.isSpaceKeyDown = false;
                this.waitForSpaceRelease = false;
                this.helicopter.stopLift();
            }
        });

        // Touch input
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isSpaceKeyDown = true;
            if (this.gameState === 'start') {
                this.gameState = 'takeoff';
                this.helicopter.y = this.canvas.height - 50;
            } else if (this.gameState === 'takeoff') {
                this.gameState = 'playing';
                this.helicopter.lift();
            } else if (this.gameState === 'gameover') {
                if (!this.waitForSpaceRelease) {
                    this.reset();
                    this.gameState = 'takeoff';
                    this.helicopter.y = this.canvas.height - 50;
                }
            } else {
                this.helicopter.lift();
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isSpaceKeyDown = false;
            this.waitForSpaceRelease = false;
            this.helicopter.stopLift();
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        this.leaderboardElement = document.getElementById('leaderboard-entries');
        this.updateLeaderboardDisplay();

        this.backgroundFormations = [];
        this.bgFormationTimer = 0;
        this.edgeFormationTop = new EdgeFormation(this.canvas, true);
        this.edgeFormationBottom = new EdgeFormation(this.canvas, false);
        this.helipad = new Helipad(this.canvas, 30);

        this.targetFps = 60;
        this.speedScale = 1;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.currentFps = 0;

        this.helicopterSound = null;
        this.lastMilestone = 0;
        this.explosionParticles = [];

        this.setupHelicopterButton();
        this.createHomeScreenElements();
    }

    detectMobile() {
        return (window.innerWidth < 400) || ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
    }

    getScrollSpeed() {
        return this.scrollSpeed;
    }

    start() {
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    gameLoop(timestamp) {
        const elapsed = timestamp - this.lastTime;
        if (elapsed > this.frameInterval) {
            this.lastTime = timestamp - (elapsed % this.frameInterval);
            this.update();
            this.draw();
        }
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update() {
        const currentScrollSpeed = this.getScrollSpeed();

        // Update stars twinkle
        this.stars.forEach(s => {
            s.twinklePhase += s.twinkleSpeed;
        });

        // Update ambient particles
        this.ambientParticles.forEach(p => {
            p.y -= p.speed;
            if (p.y < 0) {
                p.y = this.canvas.height;
                p.x = Math.random() * this.canvas.width;
            }
        });

        // Update score popups
        for (let i = this.scorePopups.length - 1; i >= 0; i--) {
            this.scorePopups[i].update();
            if (this.scorePopups[i].opacity <= 0) this.scorePopups.splice(i, 1);
        }

        // Screen shake decay
        if (this.shakeDuration > 0) {
            this.shakeDuration--;
            this.shakeAmount *= 0.9;
        } else {
            this.shakeAmount = 0;
        }

        if (this.gameState === 'start') {
            this.homeBackgroundFormations.forEach(f => f.update(currentScrollSpeed * 0.5));
            this.homeEdgeFormationTop.update(currentScrollSpeed * 0.5);
            this.homeEdgeFormationBottom.update(currentScrollSpeed * 0.5);
            if (this.decorativeHelicopter) {
                this.decorativeHelicopter.y += Math.sin(Date.now() / 300) * 0.5;
            }
            return;
        }

        if (this.gameState === 'playing') {
            // Background formations
            this.bgFormationTimer++;
            if (this.bgFormationTimer > this.bgFormationInterval) {
                this.backgroundFormations.push(new BackgroundFormation(this.canvas));
                this.bgFormationTimer = 0;
            }
            for (let i = this.backgroundFormations.length - 1; i >= 0; i--) {
                this.backgroundFormations[i].update(currentScrollSpeed);
                if (this.backgroundFormations[i].x + this.backgroundFormations[i].width < 0) {
                    this.backgroundFormations.splice(i, 1);
                }
            }

            if (!this.isGameOver) {
                this.helicopter.update();

                // Floor/ceiling collision
                if (this.helicopter.y <= 0 ||
                    this.helicopter.y >= this.canvas.height - this.helicopter.height) {
                    this.handleCollision();
                    return;
                }

                // Obstacles
                this.obstacleTimer++;
                if (this.obstacleTimer > this.obstacleInterval) {
                    const lastObstacle = this.obstacles.length > 0 ? this.obstacles[this.obstacles.length - 1] : null;
                    this.obstacles.push(new Obstacle(this.canvas, Math.floor(this.score / 10), this.isMobile, lastObstacle));
                    this.obstacleTimer = 0;
                }

                for (let i = this.obstacles.length - 1; i >= 0; i--) {
                    const obstacle = this.obstacles[i];
                    obstacle.update(currentScrollSpeed);
                    if (obstacle.x + obstacle.width < 0) {
                        this.obstacles.splice(i, 1);
                        continue;
                    }
                    if (obstacle.collidesWith(this.helicopter)) {
                        this.handleCollision();
                    }
                }

                // Gems
                this.gemTimer++;
                if (this.gemTimer > this.obstacleInterval * 0.6) {
                    // Place gem in the middle of the gap of the next obstacle area
                    const gemY = this.canvas.height * 0.2 + Math.random() * this.canvas.height * 0.6;
                    this.gems.push(new Gem(this.canvas.width + 50, gemY));
                    this.gemTimer = 0;
                }

                for (let i = this.gems.length - 1; i >= 0; i--) {
                    this.gems[i].update(currentScrollSpeed);
                    if (this.gems[i].x < -20) {
                        this.gems.splice(i, 1);
                        continue;
                    }
                    if (this.gems[i].collidesWith(this.helicopter)) {
                        this.gems[i].collected = true;
                        this.score += 250; // +25 displayed score
                        this.scorePopups.push(new ScorePopup(
                            this.gems[i].x, this.gems[i].y, '+25', '#00ffcc'
                        ));
                        this.gems.splice(i, 1);
                    }
                }

                // Milestone check
                const gameScore = Math.floor(this.score / 10);
                const currentMilestone = Math.floor(gameScore / 250) * 250;
                if (currentMilestone > this.lastMilestone && currentMilestone <= 1000) {
                    this.gameAudio.play('difficulty');
                    this.lastMilestone = currentMilestone;
                }

                this.score += (60 / this.fps);
            }

            // Edge formations
            this.edgeFormationTop.update(currentScrollSpeed);
            this.edgeFormationBottom.update(currentScrollSpeed);

            // Helipad
            if (this.helipad && !this.helipad.isOffScreen()) {
                this.helipad.update(currentScrollSpeed);
            }

            // Explosion particles
            for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
                this.explosionParticles[i].update();
                if (this.explosionParticles[i].opacity <= 0) {
                    this.explosionParticles.splice(i, 1);
                }
            }
        }
    }

    draw() {
        const ctx = this.ctx;

        // Apply screen shake
        ctx.save();
        if (this.shakeAmount > 0) {
            const dx = (Math.random() - 0.5) * this.shakeAmount;
            const dy = (Math.random() - 0.5) * this.shakeAmount;
            ctx.translate(dx, dy);
        }

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Dynamic gradient background based on score
        const difficulty = Math.min(Math.floor(this.score / 10) / 1500, 1);
        const bgGrad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        if (difficulty < 0.5) {
            bgGrad.addColorStop(0, this.lerpColor('#0a0a2e', '#1a0a2e', difficulty * 2));
            bgGrad.addColorStop(1, this.lerpColor('#0a1a1a', '#1a0a1a', difficulty * 2));
        } else {
            bgGrad.addColorStop(0, this.lerpColor('#1a0a2e', '#2a0a1a', (difficulty - 0.5) * 2));
            bgGrad.addColorStop(1, this.lerpColor('#1a0a1a', '#1a0505', (difficulty - 0.5) * 2));
        }
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Star field
        this.stars.forEach(s => {
            const twinkle = 0.3 + Math.sin(s.twinklePhase) * 0.3;
            ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });

        if (this.gameState === 'start') {
            this.drawHomeScreenElements();
            this.drawTitle(ctx);
            ctx.restore();
            return;
        }

        if (this.gameState === 'playing' || this.gameState === 'gameover' || this.gameState === 'takeoff') {
            // Background formations
            this.backgroundFormations.forEach(f => f.draw(ctx));

            // Edge formations
            this.edgeFormationTop.draw(ctx);
            this.edgeFormationBottom.draw(ctx);

            // Ambient particles
            this.ambientParticles.forEach(p => {
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });

            // Helipad
            if (this.helipad && !this.helipad.isOffScreen()) {
                this.helipad.draw(ctx);
            }

            // Obstacles, gems, helicopter
            this.obstacles.forEach(o => o.draw(ctx));
            this.gems.forEach(g => g.draw(ctx));
            this.helicopter.draw(ctx);

            // Score popups
            this.scorePopups.forEach(p => p.draw(ctx));
        }

        // HUD
        if (this.gameState === 'playing' || this.gameState === 'gameover') {
            const padding = this.isMobile ? 20 : 10;
            ctx.fillStyle = this.textColor;
            ctx.font = "bold 18px 'Orbitron', sans-serif";
            ctx.textAlign = 'left';

            // Score with glow
            ctx.save();
            ctx.shadowColor = 'rgba(0, 200, 150, 0.5)';
            ctx.shadowBlur = 6;
            ctx.fillText(`${Math.floor(this.score / 10)}`, padding, 30);
            ctx.restore();

            ctx.textAlign = 'right';
            ctx.font = "14px 'Inter', sans-serif";
            ctx.fillStyle = '#888';
            ctx.fillText(`Best: ${Math.floor(this.highScore / 10)}`, this.canvas.width - padding, 30);
            ctx.textAlign = 'left';
        }

        // Takeoff instructions
        if (this.gameState === 'takeoff') {
            ctx.fillStyle = this.textColor;
            ctx.font = "20px 'Orbitron', sans-serif";
            ctx.textAlign = 'center';
            const alpha = 0.5 + Math.sin(Date.now() / 400) * 0.5;
            ctx.globalAlpha = alpha;
            ctx.fillText(this.isMobile ? 'Tap to Take Off' : 'Press Space to Take Off',
                this.canvas.width / 2, this.canvas.height / 2);
            ctx.globalAlpha = 1;
            ctx.textAlign = 'left';
        }

        // Game over
        if (this.gameState === 'gameover') {
            // Dark overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.textAlign = 'center';

            // Game over text with glow
            ctx.save();
            ctx.shadowColor = 'rgba(255, 80, 50, 0.6)';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#ff6644';
            ctx.font = "bold 42px 'Orbitron', sans-serif";
            ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
            ctx.restore();

            // Score
            ctx.fillStyle = '#fff';
            ctx.font = "18px 'Orbitron', sans-serif";
            ctx.fillText(`Score: ${Math.floor(this.score / 10)}`, this.canvas.width / 2, this.canvas.height / 2 + 20);

            // Restart prompt
            const alpha = 0.4 + Math.sin(Date.now() / 500) * 0.4;
            ctx.globalAlpha = alpha;
            ctx.font = "16px 'Inter', sans-serif";
            ctx.fillStyle = '#ccc';
            ctx.fillText(this.isMobile ? 'Tap to Restart' : 'Press Space to Restart',
                this.canvas.width / 2, this.canvas.height / 2 + 55);
            ctx.globalAlpha = 1;
            ctx.textAlign = 'left';
        }

        // Explosion particles
        this.explosionParticles.forEach(p => p.draw(ctx));

        ctx.restore(); // end screen shake
    }

    drawTitle(ctx) {
        ctx.textAlign = 'center';

        // Title with glow
        ctx.save();
        ctx.shadowColor = 'rgba(0, 200, 150, 0.6)';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#fff';
        ctx.font = "bold 40px 'Orbitron', sans-serif";
        ctx.fillText('HELICOPTER', this.canvas.width / 2, this.canvas.height / 2 - 50);
        ctx.font = "bold 28px 'Orbitron', sans-serif";
        ctx.fillStyle = '#00c896';
        ctx.fillText('ADVENTURE', this.canvas.width / 2, this.canvas.height / 2 - 10);
        ctx.restore();

        // Start prompt with breathing animation
        const alpha = 0.4 + Math.sin(Date.now() / 600) * 0.4;
        ctx.globalAlpha = alpha;
        ctx.font = "16px 'Inter', sans-serif";
        ctx.fillStyle = '#aaa';
        ctx.fillText(this.isMobile ? 'Tap to Start' : 'Press Space to Start',
            this.canvas.width / 2, this.canvas.height / 2 + 40);
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
    }

    lerpColor(a, b, t) {
        const ah = parseInt(a.replace(/#/g, ''), 16);
        const bh = parseInt(b.replace(/#/g, ''), 16);
        const ar = ah >> 16, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
        const br = bh >> 16, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
        const rr = Math.round(ar + (br - ar) * t);
        const rg = Math.round(ag + (bg - ag) * t);
        const rb = Math.round(ab + (bb - ab) * t);
        return `#${((rr << 16) | (rg << 8) | rb).toString(16).padStart(6, '0')}`;
    }

    createExplosion(x, y) {
        const numParticles = 40;
        for (let i = 0; i < numParticles; i++) {
            const angle = (Math.PI * 2 * i) / numParticles;
            const speed = 2 + Math.random() * 3;
            this.explosionParticles.push(new ExplosionParticle(x, y, angle, speed));
        }
    }

    handleCollision() {
        this.gameState = 'gameover';
        this.isGameOver = true;
        if (this.isSpaceKeyDown) this.waitForSpaceRelease = true;

        // Screen shake
        this.shakeAmount = 12;
        this.shakeDuration = 20;

        this.gameAudio.play('crash');
        this.createExplosion(this.helicopter.x, this.helicopter.y);

        if (this.helicopter.liftSound) {
            this.gameAudio.stopSound(this.helicopter.liftSound);
            this.helicopter.liftSound = null;
        }
        this.updateHighScore();
    }

    reset() {
        if (this.helicopter.liftSound) {
            this.gameAudio.stopSound(this.helicopter.liftSound);
            this.helicopter.liftSound = null;
        }
        const currentType = this.selectedHelicopterType || 'scout';
        this.helicopter = new Helicopter(130, this.canvas.height - 60, this.canvas, this.gameAudio);
        this.helicopter.setType(currentType);
        this.helipad = new Helipad(this.canvas, 30);
        this.obstacles = [];
        this.obstacleTimer = 0;
        this.gems = [];
        this.gemTimer = 0;
        this.scorePopups = [];
        this.score = 0;
        this.isGameOver = false;
        this.lastMilestone = 0;
        this.gameState = 'start';
        this.explosionParticles = [];
        this.shakeAmount = 0;
        this.shakeDuration = 0;
        this.createHomeScreenElements();
    }

    // --- Leaderboard ---
    updateLeaderboardDisplay() {
        let leaderboardHTML = `
            <div class="score-entry header">
                <span>Pilot</span>
                <span class="helicopter-type">Type</span>
                <span>Score</span>
            </div>
        `;
        leaderboardHTML += this.leaderboard
            .map((entry, index) => {
                let position;
                switch (index) {
                    case 0: position = '🥇'; break;
                    case 1: position = '🥈'; break;
                    case 2: position = '🥉'; break;
                    default: position = `${index + 1}.`;
                }
                const helicopterType = entry.helicopterType || '---';
                const scoreStr = entry.score.toString();
                const paddedScore = scoreStr.padStart(6, '0');
                const leadingZerosCount = paddedScore.length - scoreStr.length;
                let formattedScore = '';
                if (leadingZerosCount > 0) {
                    formattedScore = `<span style="opacity: 0.3">${paddedScore.substring(0, leadingZerosCount)}</span>${scoreStr}`;
                } else {
                    formattedScore = scoreStr;
                }
                return `
                    <div class="score-entry">
                        <span>${position} ${entry.initials}</span>
                        <span class="helicopter-type">${helicopterType}</span>
                        <span>${formattedScore}</span>
                    </div>
                `;
            }).join('');
        this.leaderboardElement.innerHTML = leaderboardHTML;
    }

    loadLeaderboard() {
        this.database.ref('scores').once('value')
            .then((snapshot) => {
                const data = snapshot.val();
                if (data) {
                    this.leaderboard = Object.entries(data)
                        .map(([key, value]) => ({
                            initials: value.initials || 'AAA',
                            score: value.score || 0,
                            date: value.date || new Date().toLocaleDateString(),
                            helicopterType: value.helicopterType || 'Scout'
                        }))
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 5);
                    this.updateLeaderboardDisplay();
                }
            })
            .catch((error) => {
                console.error('Error loading leaderboard:', error);
            });
    }

    updateHighScore() {
        if (this.score > this.highScore) this.highScore = this.score;

        const currentScore = Math.floor(this.score / 10);
        if (this.leaderboard.length < 5 || currentScore > this.leaderboard[this.leaderboard.length - 1].score) {
            setTimeout(() => { this.gameAudio.play('highScore'); }, 500);

            const modal = document.getElementById('highScoreModal');
            const input = document.getElementById('initialsInput');
            const submitBtn = document.getElementById('submitScore');

            modal.style.display = 'flex';
            input.value = '';
            input.focus();

            const handleSubmit = () => {
                let initials = input.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'AAA';
                const helicopterType = this.selectedHelicopterType.charAt(0).toUpperCase() + this.selectedHelicopterType.slice(1);
                const newScoreRef = this.database.ref('scores').push();
                newScoreRef.set({
                    score: currentScore,
                    initials: initials,
                    date: new Date().toLocaleDateString(),
                    helicopterType: helicopterType
                }).then(() => {
                    this.loadLeaderboard();
                }).catch((error) => {
                    console.error('Error submitting score:', error);
                });
                modal.style.display = 'none';
                submitBtn.removeEventListener('click', handleSubmit);
                input.removeEventListener('keypress', handleKeypress);
            };

            const handleKeypress = (e) => {
                if (e.key === 'Enter') handleSubmit();
            };

            submitBtn.addEventListener('click', handleSubmit);
            input.addEventListener('keypress', handleKeypress);
        }
    }

    // --- Helicopter Selection ---
    setupHelicopterButton() {
        const helicopterButton = document.querySelector('.utility-button[data-action="helicopter"]');
        const modal = document.getElementById('helicopterModal');
        const closeButton = document.getElementById('closeHelicopterModal');

        if (helicopterButton) {
            helicopterButton.onclick = () => {
                if (modal) {
                    this.populateHelicopterOptions();
                    modal.style.display = 'flex';
                }
            };
        }
        if (closeButton) {
            closeButton.onclick = () => { if (modal) modal.style.display = 'none'; };
        }
        if (modal) {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) modal.style.display = 'none';
            });
        }
    }

    populateHelicopterOptions() {
        const modalContent = document.querySelector('#helicopterModal .modal-content');
        if (!modalContent) return;

        if (!modalContent.querySelector('.close-icon')) {
            const closeIcon = document.createElement('span');
            closeIcon.className = 'close-icon';
            closeIcon.innerHTML = '&times;';
            closeIcon.addEventListener('click', () => {
                document.getElementById('helicopterModal').style.display = 'none';
            });
            modalContent.prepend(closeIcon);
        }

        const closeButton = modalContent.querySelector('.close-button');
        if (closeButton) closeButton.remove();

        let titleElement = modalContent.querySelector('h3');
        if (!titleElement) {
            titleElement = document.createElement('h3');
            modalContent.insertBefore(titleElement, modalContent.firstChild);
        }
        titleElement.textContent = 'Choose Your Helicopter';

        const optionsContainer = modalContent.querySelector('.helicopter-options');
        if (!optionsContainer) return;
        optionsContainer.innerHTML = '';

        const generateBlockRating = (rating) => {
            let blocks = '';
            for (let i = 1; i <= 5; i++) {
                blocks += `<div class="stat-block ${i <= rating ? 'filled' : 'empty'}"></div>`;
            }
            return `<div class="stat-blocks">${blocks}</div>`;
        };

        optionsContainer.innerHTML = `
            <div class="helicopter-cards">
                <div class="helicopter-card ${this.selectedHelicopterType === 'scout' ? 'selected active' : ''}" data-type="scout">
                    <div class="card-header">
                        <div class="card-image scout-image"></div>
                        <div class="card-title">
                            <h3>Scout</h3>
                            <p>Fast & Agile</p>
                        </div>
                    </div>
                    <div class="helicopter-stats">
                        <div class="stat-row">
                            <span class="stat-label">Lift</span>
                            ${generateBlockRating(3)}
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Drop</span>
                            ${generateBlockRating(3)}
                        </div>
                    </div>
                </div>
                <div class="helicopter-card ${this.selectedHelicopterType === 'tanker' ? 'selected active' : ''}" data-type="tanker">
                    <div class="card-header">
                        <div class="card-image tanker-image"></div>
                        <div class="card-title">
                            <h3>Tanker</h3>
                            <p>Sturdy & Efficient</p>
                        </div>
                    </div>
                    <div class="helicopter-stats">
                        <div class="stat-row">
                            <span class="stat-label">Lift</span>
                            ${generateBlockRating(2)}
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Drop</span>
                            ${generateBlockRating(5)}
                        </div>
                    </div>
                </div>
            </div>
        `;

        const helicopterCards = document.querySelectorAll('.helicopter-card');
        helicopterCards.forEach(card => {
            card.addEventListener('click', () => {
                const type = card.getAttribute('data-type');
                this.selectedHelicopterType = type;
                helicopterCards.forEach(c => {
                    c.classList.remove('selected');
                    c.classList.remove('active');
                });
                card.classList.add('selected');
                card.classList.add('active');
                this.helicopter.setType(type);
                if (this.decorativeHelicopter) this.decorativeHelicopter.setType(type);
                document.getElementById('helicopterModal').style.display = 'none';
            });
        });

        if (!this.selectedHelicopterType) {
            this.selectedHelicopterType = 'scout';
            this.helicopter.setType('scout');
        }
    }

    // --- Home Screen ---
    createHomeScreenElements() {
        this.homeBackgroundFormations = [];
        for (let i = 0; i < 3; i++) {
            this.homeBackgroundFormations.push(new BackgroundFormation(this.canvas));
        }
        this.homeEdgeFormationTop = new EdgeFormation(this.canvas, true);
        this.homeEdgeFormationBottom = new EdgeFormation(this.canvas, false);
        this.decorativeHelicopter = new Helicopter(
            this.canvas.width * 0.2,
            this.canvas.height * 0.45,
            this.canvas,
            this.gameAudio
        );
        this.decorativeHelicopter.setType(this.selectedHelicopterType || 'scout');
        this.createAmbientParticles();
    }

    createAmbientParticles() {
        this.ambientParticles = [];
        for (let i = 0; i < 25; i++) {
            this.ambientParticles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 1 + Math.random() * 2,
                speed: 0.2 + Math.random() * 0.5,
                opacity: 0.15 + Math.random() * 0.2
            });
        }
    }

    drawHomeScreenElements() {
        this.homeBackgroundFormations.forEach(f => f.draw(this.ctx));
        this.homeEdgeFormationTop.draw(this.ctx);
        this.homeEdgeFormationBottom.draw(this.ctx);

        this.ambientParticles.forEach(p => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Decorative helicopter with spinning rotor
        if (this.decorativeHelicopter) {
            this.decorativeHelicopter.isLifting = true;
            this.decorativeHelicopter.draw(this.ctx);
        }
    }
}

// --- Start ---
window.onload = () => {
    const game = new Game();
    game.start();
};
