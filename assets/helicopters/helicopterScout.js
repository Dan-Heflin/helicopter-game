import BaseHelicopter from './baseHelicopter.js';

class HelicopterScout extends BaseHelicopter {
    constructor(x, y, canvas, gameAudio) {
        super(x, y, canvas, gameAudio);
        
        // Visual properties specific to Scout
        this.bodyColor = '#4682B4';  // Steel blue
        this.accentColor = '#FFD700'; // Bright yellow
        this.rotorColor = '#1A1A1A';  // Black
        this.rotorSpeed = 0.5;        // Faster rotor
        this.rotorAngle = 0;          // Initialize rotor angle
    }
    
    update() {
        // Call the parent update method
        super.update();
        
        // Update rotor angle
        this.rotorAngle += this.rotorSpeed;
    }

    draw(ctx) {
        ctx.save();
        
        // Draw particles
        this.particles.forEach(particle => particle.draw(ctx));
        
        // Main body (sleek teardrop shape)
        ctx.fillStyle = this.bodyColor;
        ctx.beginPath();
        ctx.moveTo(this.x + 40, this.y + this.height/2);  // Nose
        ctx.quadraticCurveTo(
            this.x + 45, this.y + this.height/2,  // Control point
            this.x + 42, this.y + this.height/2 + 4  // End point
        );
        ctx.lineTo(this.x + 10, this.y + this.height - 2);  // Bottom curve
        ctx.lineTo(this.x - 5, this.y + this.height/2 + 2);  // Tail bottom
        ctx.lineTo(this.x - 5, this.y + this.height/2 - 2);  // Tail top
        ctx.lineTo(this.x + 10, this.y + 2);  // Top curve
        ctx.closePath();
        ctx.fill();

        // Tail boom (longer and slightly thicker)
        ctx.fillStyle = this.bodyColor;
        ctx.fillRect(this.x - 20, this.y + this.height/2 - 1.5, 18, 3);

        // Tail fin (vertical stabilizer)
        ctx.beginPath();
        ctx.moveTo(this.x - 20, this.y + this.height/2 - 6);  // Top
        ctx.lineTo(this.x - 20, this.y + this.height/2 + 6);  // Bottom
        ctx.lineTo(this.x - 23, this.y + this.height/2);      // Back point
        ctx.closePath();
        ctx.fill();

        // Tail rotor with motion blur effect
        ctx.save();
        ctx.translate(this.x - 20, this.y + this.height/2);
        ctx.rotate(this.forceRotorUpdate() / 100);  // Use forceRotorUpdate instead of Date.now()
        
        // Draw multiple tail rotor lines for blur effect
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

        // Yellow accent stripe
        ctx.fillStyle = this.accentColor;
        ctx.beginPath();
        ctx.moveTo(this.x + 38, this.y + this.height/2);
        ctx.lineTo(this.x, this.y + this.height/2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = this.accentColor;
        ctx.stroke();

        // Cockpit window
        const windowGradient = ctx.createLinearGradient(
            this.x + 25, this.y + 4,
            this.x + 25, this.y + this.height - 4
        );
        windowGradient.addColorStop(0, 'rgba(135, 206, 235, 0.9)');
        windowGradient.addColorStop(1, 'rgba(135, 206, 235, 0.6)');
        
        ctx.fillStyle = windowGradient;
        ctx.beginPath();
        ctx.moveTo(this.x + 35, this.y + this.height/2);
        ctx.quadraticCurveTo(
            this.x + 30, this.y + 4,
            this.x + 20, this.y + 6
        );
        ctx.lineTo(this.x + 15, this.y + this.height/2 - 2);
        ctx.quadraticCurveTo(
            this.x + 25, this.y + this.height - 4,
            this.x + 35, this.y + this.height/2
        );
        ctx.closePath();
        ctx.fill();

        // Landing skids
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1.5;
        
        // Front skid
        ctx.beginPath();
        ctx.moveTo(this.x + 30, this.y + this.height);
        ctx.lineTo(this.x + 30, this.y + this.height + 3);
        ctx.lineTo(this.x + 10, this.y + this.height + 3);
        ctx.stroke();
        
        // Rear skid
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height + 3);
        ctx.lineTo(this.x - 15, this.y + this.height + 3);
        ctx.stroke();

        // Main rotor with motion blur effect
        ctx.save();
        ctx.translate(this.x + 15, this.y + 2);
        
        // Draw multiple rotor blades for blur effect
        for (let i = 0; i < 2; i++) {
            ctx.rotate(this.rotorAngle + i * Math.PI);
            ctx.strokeStyle = `rgba(26, 26, 26, ${0.8 - i * 0.2})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-25, 0);
            ctx.lineTo(25, 0);
            ctx.stroke();
        }
        
        // Rotor hub
        ctx.fillStyle = this.rotorColor;
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        ctx.restore();
    }
}

export default HelicopterScout; 