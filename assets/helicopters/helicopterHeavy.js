import BaseHelicopter from './baseHelicopter.js';

class HelicopterHeavy extends BaseHelicopter {
    constructor(x, y, canvas, gameAudio) {
        super(x, y, canvas, gameAudio);
        
        // Adjust physics for heavy helicopter
        this.gravity = 0.25;       // Heavier
        this.liftForce = -3.0;     // Stronger lift
        this.maxLiftVelocity = 3;  // Slower max upward speed
        this.maxFallVelocity = 7;  // Faster falling
        
        // Size - slightly larger
        this.width = 60;
        this.height = 25;
        
        // Visual properties specific to Heavy
        this.bodyColor = '#555555';  // Darker gray
        this.accentColor = '#FF4500'; // Orange-red
        this.rotorColor = '#1A1A1A';  // Black
        this.rotorSpeed = 0.4;        // Slower rotor
    }

    draw(ctx) {
        ctx.save();
        
        // Draw particles
        this.particles.forEach(particle => particle.draw(ctx));
        
        // Main body (bulkier shape)
        ctx.fillStyle = this.bodyColor;
        ctx.beginPath();
        ctx.moveTo(this.x + 45, this.y + this.height/2);  // Nose
        ctx.quadraticCurveTo(
            this.x + 50, this.y + this.height/2,  // Control point
            this.x + 48, this.y + this.height/2 + 6  // End point
        );
        ctx.lineTo(this.x + 15, this.y + this.height);  // Bottom curve
        ctx.lineTo(this.x - 10, this.y + this.height/2 + 3);  // Tail bottom
        ctx.lineTo(this.x - 10, this.y + this.height/2 - 3);  // Tail top
        ctx.lineTo(this.x + 15, this.y);  // Top curve
        ctx.closePath();
        ctx.fill();

        // Tail boom (thicker)
        ctx.fillStyle = this.bodyColor;
        ctx.fillRect(this.x - 25, this.y + this.height/2 - 2, 18, 4);

        // Tail fin (larger vertical stabilizer)
        ctx.beginPath();
        ctx.moveTo(this.x - 25, this.y + this.height/2 - 8);  // Top
        ctx.lineTo(this.x - 25, this.y + this.height/2 + 8);  // Bottom
        ctx.lineTo(this.x - 30, this.y + this.height/2);      // Back point
        ctx.closePath();
        ctx.fill();

        // Tail rotor with motion blur effect
        ctx.save();
        ctx.translate(this.x - 25, this.y + this.height/2);
        ctx.rotate(Date.now() / 120);  // Slower rotation
        
        // Draw multiple tail rotor lines for blur effect
        for (let i = 0; i < 2; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.strokeStyle = `rgba(26, 26, 26, ${0.7 - i * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-6, 0);
            ctx.lineTo(6, 0);
            ctx.stroke();
        }
        ctx.restore();

        // Orange accent stripe
        ctx.fillStyle = this.accentColor;
        ctx.beginPath();
        ctx.moveTo(this.x + 42, this.y + this.height/2);
        ctx.lineTo(this.x, this.y + this.height/2);
        ctx.lineWidth = 3;  // Thicker stripe
        ctx.strokeStyle = this.accentColor;
        ctx.stroke();

        // Cockpit window (smaller, more armored look)
        const windowGradient = ctx.createLinearGradient(
            this.x + 30, this.y + 5,
            this.x + 30, this.y + this.height - 5
        );
        windowGradient.addColorStop(0, 'rgba(100, 150, 180, 0.9)');  // Darker blue
        windowGradient.addColorStop(1, 'rgba(100, 150, 180, 0.6)');
        
        ctx.fillStyle = windowGradient;
        ctx.beginPath();
        ctx.moveTo(this.x + 40, this.y + this.height/2);
        ctx.quadraticCurveTo(
            this.x + 35, this.y + 5,
            this.x + 25, this.y + 7
        );
        ctx.lineTo(this.x + 20, this.y + this.height/2 - 2);
        ctx.quadraticCurveTo(
            this.x + 30, this.y + this.height - 5,
            this.x + 40, this.y + this.height/2
        );
        ctx.closePath();
        ctx.fill();

        // Landing skids
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        
        // Front skid
        ctx.beginPath();
        ctx.moveTo(this.x + 35, this.y + this.height);
        ctx.lineTo(this.x + 35, this.y + this.height + 3);
        ctx.lineTo(this.x + 15, this.y + this.height + 3);
        ctx.stroke();
        
        // Rear skid
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height + 3);
        ctx.lineTo(this.x - 15, this.y + this.height + 3);
        ctx.stroke();

        // Main rotor with motion blur effect (larger rotor)
        ctx.save();
        ctx.translate(this.x + 20, this.y);
        
        // Draw multiple rotor blades for blur effect
        for (let i = 0; i < 3; i++) {
            ctx.rotate(this.forceRotorUpdate() / 60 + i * (Math.PI * 2 / 3));  // Use forceRotorUpdate
            ctx.strokeStyle = `rgba(26, 26, 26, ${0.8 - i * 0.2})`;
            ctx.lineWidth = 2.5;  // Thicker blades
            ctx.beginPath();
            ctx.moveTo(-30, 0);
            ctx.lineTo(30, 0);
            ctx.stroke();
        }
        ctx.restore();
        
        ctx.restore();
    }
}

export default HelicopterHeavy; 