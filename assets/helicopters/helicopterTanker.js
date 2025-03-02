import BaseHelicopter from './baseHelicopter.js';

class HelicopterTanker extends BaseHelicopter {
    constructor(x, y, canvas, gameAudio) {
        super(x, y, canvas, gameAudio);
        
        // Adjust physics for tanker helicopter
        this.gravity = 0.3;  // Heavier, falls faster
        this.lift = -4.5;    // Less powerful lift
        
        // Size - make it larger and more imposing
        this.width = 70;
        this.height = 30;
        
        // Visual properties specific to Tanker
        this.bodyColor = '#1F5C1F';  // Dark green
        this.accentColor = '#FF0000'; // Red for warning lights
        this.rotorColor = '#1a1a1a'; // Black rotors
        this.rotorSpeed = 0.3; // Slower rotor speed for heavier feel
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Draw main body - chunky rectangular shape, wider in the middle
        ctx.fillStyle = this.bodyColor;
        ctx.beginPath();
        ctx.moveTo(-30, -8);  // Top left
        ctx.lineTo(20, -10);  // Top right
        ctx.lineTo(25, 0);    // Middle right
        ctx.lineTo(20, 10);   // Bottom right
        ctx.lineTo(-30, 8);   // Bottom left
        ctx.closePath();
        ctx.fill();
        
        // Draw cockpit - smaller, more armored looking
        ctx.fillStyle = '#ADD8E6';
        ctx.beginPath();
        ctx.ellipse(10, -2, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw tail - longer and thicker
        ctx.fillStyle = this.bodyColor;
        ctx.beginPath();
        ctx.moveTo(-30, 0);
        ctx.lineTo(-45, -5);
        ctx.lineTo(-45, 5);
        ctx.closePath();
        ctx.fill();
        
        // Draw tail rotor - blocky
        ctx.fillStyle = this.rotorColor;
        ctx.fillRect(-48, -7, 3, 14);
        
        // Draw red warning lights
        ctx.fillStyle = this.accentColor;
        // Top warning light
        ctx.beginPath();
        ctx.arc(0, -10, 2, 0, Math.PI * 2);
        ctx.fill();
        // Bottom warning light
        ctx.beginPath();
        ctx.arc(0, 10, 2, 0, Math.PI * 2);
        ctx.fill();
        // Tail warning light
        ctx.beginPath();
        ctx.arc(-40, -5, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw main rotor
        ctx.save();
        ctx.translate(0, -10);
        
        // Rotor shaft - thicker
        ctx.fillStyle = this.rotorColor;
        ctx.fillRect(-2, -3, 4, 3);
        
        // Rotating blades - thicker and more square
        for (let i = 0; i < 2; i++) {
            ctx.save();
            ctx.rotate(this.rotorAngle + i * Math.PI);
            ctx.strokeStyle = this.rotorColor;
            ctx.lineWidth = 4; // Thicker blades
            ctx.beginPath();
            ctx.moveTo(-2, 0);
            ctx.lineTo(-this.width/2, 0);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(2, 0);
            ctx.lineTo(this.width/2, 0);
            ctx.stroke();
            ctx.restore();
        }
        
        // Rotor hub - square and rugged
        ctx.fillStyle = this.rotorColor;
        ctx.fillRect(-4, -4, 8, 8);
        ctx.restore();
        
        // Draw hitbox for debugging if needed
        if (this.showHitbox) {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 1;
            ctx.strokeRect(
                -this.width/2 - this.hitboxPadding,
                -this.height/2 - this.hitboxPadding,
                this.width + this.hitboxPadding*2,
                this.height + this.hitboxPadding*2
            );
        }
        
        ctx.restore();
    }
}

export default HelicopterTanker; 