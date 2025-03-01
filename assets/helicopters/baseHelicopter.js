import Particle from '../../particle.js';

class BaseHelicopter {
    constructor(x, y, canvas, gameAudio) {
        // Position and canvas
        this.x = x;
        this.y = y;
        this.canvas = canvas;
        this.gameAudio = gameAudio;
        
        // Physics properties
        this.velocity = 0;
        this.gravity = 0.2;
        this.liftForce = -2.5;
        this.maxLiftVelocity = 4;
        this.maxFallVelocity = 6;
        
        // Size
        this.width = 50;
        this.height = 20;
        
        // State
        this.isLifting = false;
        this.particles = [];
        this.particleTimer = 0;
        this.liftSound = null;
    }

    update() {
        if (this.isLifting) {
            this.velocity += this.liftForce * 0.2;
            // Cap upward velocity
            if (this.velocity < -this.maxLiftVelocity) {
                this.velocity = -this.maxLiftVelocity;
            }
        }
        
        // Apply gravity
        this.velocity += this.gravity;
        
        // Cap downward velocity
        if (this.velocity > this.maxFallVelocity) {
            this.velocity = this.maxFallVelocity;
        }
        
        this.y += this.velocity;

        if (this.y > this.canvas.height - this.height) {
            this.y = this.canvas.height - this.height;
            this.velocity = 0;
        }
        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }

        // Update particles
        this.particleTimer++;
        if (this.particleTimer > 2) { // Emit particle every 2 frames
            this.particles.push(new Particle(this.x - 15, this.y + 15));
            this.particleTimer = 0;
        }

        // Update existing particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update();

            // Remove particles that are too small or transparent
            if (particle.size <= 0.2 || particle.opacity <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        // This should be implemented by child classes
        console.warn('draw() method not implemented');
    }

    lift() {
        this.isLifting = true;
        
        // Play helicopter sound if not already playing
        if (!this.liftSound) {
            this.liftSound = this.gameAudio.play('helicopter', true);
        }
    }

    stopLift() {
        this.isLifting = false;
        
        // Stop the helicopter sound when lifting stops
        if (this.liftSound) {
            this.gameAudio.stopSound(this.liftSound);
            this.liftSound = null;
        }
    }

    forceRotorUpdate() {
        // This method ensures the rotors animate even when the helicopter isn't moving
        return Date.now(); // Return the current timestamp for rotor animation
    }
}

export default BaseHelicopter; 