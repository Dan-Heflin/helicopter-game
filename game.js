class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 4 + 3;
        this.speedX = -1; // Move left with game
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = 0.8;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.opacity -= 0.008;
        this.size -= 0.03;
    }

    draw(ctx) {
        ctx.save();
        
        // Draw black outline
        ctx.strokeStyle = `rgba(0, 0, 0, ${this.opacity * 0.5})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw smoke
        ctx.fillStyle = `rgba(200, 200, 200, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class HelicopterType {
    constructor(name, description, stats) {
        this.name = name;
        this.description = description;
        this.stats = stats;
    }
}

class Helicopter {
    constructor(x, y, canvas, gameAudio) {
        // Position and canvas
        this.x = x;
        this.y = y;
        this.canvas = canvas;
        this.gameAudio = gameAudio;
        
        // Physics properties
        this.velocity = 0;
        this.gravity = 0.25; // Scout default
        this.liftForce = -5; // Scout default
        this.maxLiftVelocity = 4;
        this.maxFallVelocity = 6;
        
        // Size
        this.width = 50;
        this.height = 20;
        
        // Visual properties
        this.bodyColor = '#4682B4'; // Steel blue (Scout default)
        this.accentColor = '#FFD700'; // Bright yellow
        this.rotorColor = '#1A1A1A';  // Black
        this.rotorSpeed = 0.5;
        this.rotorAngle = 0;
        
        // State
        this.type = 'scout'; // Set Scout as default type
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

        // Apply vertical offset if it exists (for different helicopter types)
        const effectiveHeight = this.height + (this.verticalOffset || 0);
        
        if (this.y > this.canvas.height - effectiveHeight) {
            this.y = this.canvas.height - effectiveHeight;
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
        ctx.save();
        
        // Draw particles
        this.particles.forEach(particle => particle.draw(ctx));
        
        if (this.type === 'scout') {
            // SCOUT HELICOPTER - Sleek, aerodynamic design
            
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
            ctx.rotate(Date.now() / 100);
            
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

            // Main rotor
            this.rotorAngle += this.rotorSpeed;
            ctx.save();
            ctx.translate(this.x + 15, this.y + 2);
            ctx.rotate(this.rotorAngle);
            
            // Rotor blades with motion blur
            for (let i = 0; i < 2; i++) {
                ctx.rotate(Math.PI);
                ctx.strokeStyle = `rgba(26, 26, 26, ${0.7 - i * 0.3})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(this.width/2, 0);
                ctx.stroke();
            }
            
            // Rotor hub
            ctx.fillStyle = this.rotorColor;
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
        } else if (this.type === 'tanker') {
            // TANKER HELICOPTER - Military-style heavy transport
            
            // Create a position with the vertical offset applied
            const offsetY = this.y + (this.verticalOffset || 0);
            
            // Chunky main body - like a flying brick
            ctx.fillStyle = this.bodyColor;
            ctx.beginPath();
            ctx.rect(this.x - 15, offsetY + this.height/2 - 10, 45, 20);
            ctx.fill();
            
            // More pronounced nose section
            ctx.beginPath();
            ctx.moveTo(this.x + 30, offsetY + this.height/2 - 5);  // Top front
            ctx.lineTo(this.x + 35, offsetY + this.height/2);      // Nose point
            ctx.lineTo(this.x + 30, offsetY + this.height/2 + 5);  // Bottom front
            ctx.lineTo(this.x + 25, offsetY + this.height/2 + 5);  // Bottom back
            ctx.lineTo(this.x + 25, offsetY + this.height/2 - 5);  // Top back
            ctx.closePath();
            ctx.fill();
            
            // Larger cargo compartment with detail (military transport style)
            ctx.fillStyle = this.bodyColor;
            ctx.beginPath();
            ctx.rect(this.x - 10, offsetY + this.height/2 - 20, 30, 10);
            ctx.fill();
            
            // Detail panels on cargo compartment
            ctx.strokeStyle = '#4D352F'; // Darker brown for detail
            ctx.lineWidth = 1;
            // Horizontal panel lines
            ctx.beginPath();
            ctx.moveTo(this.x - 10, offsetY + this.height/2 - 15);
            ctx.lineTo(this.x + 20, offsetY + this.height/2 - 15);
            ctx.stroke();
            
            // Vertical panel lines
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(this.x - 5 + i * 10, offsetY + this.height/2 - 20);
                ctx.lineTo(this.x - 5 + i * 10, offsetY + this.height/2 - 10);
                ctx.stroke();
            }
            
            // Armored cockpit - militaristic style with angular window
            ctx.fillStyle = this.bodyColor; // Frame color
            ctx.beginPath();
            ctx.rect(this.x + 20, offsetY + this.height/2 - 8, 14, 16);
            ctx.fill();
            
            // Angular window
            ctx.fillStyle = 'rgba(135, 206, 235, 0.7)';
            ctx.beginPath();
            ctx.moveTo(this.x + 22, offsetY + this.height/2 - 6);
            ctx.lineTo(this.x + 32, offsetY + this.height/2 - 6);
            ctx.lineTo(this.x + 32, offsetY + this.height/2 + 6);
            ctx.lineTo(this.x + 22, offsetY + this.height/2 + 6);
            ctx.closePath();
            ctx.fill();
            
            // Thicker, stronger tail section
            ctx.fillStyle = this.bodyColor;
            ctx.beginPath();
            ctx.moveTo(this.x - 15, offsetY + this.height/2 - 5);
            ctx.lineTo(this.x - 45, offsetY + this.height/2 - 8);
            ctx.lineTo(this.x - 45, offsetY + this.height/2 + 8);
            ctx.lineTo(this.x - 15, offsetY + this.height/2 + 5);
            ctx.closePath();
            ctx.fill();
            
            // Add tail detail - vertical stabilizer
            ctx.beginPath();
            ctx.moveTo(this.x - 40, offsetY + this.height/2 - 8);
            ctx.lineTo(this.x - 40, offsetY + this.height/2 - 20);
            ctx.lineTo(this.x - 35, offsetY + this.height/2 - 20);
            ctx.lineTo(this.x - 35, offsetY + this.height/2 - 8);
            ctx.closePath();
            ctx.fill();
            
            // Tail rotor - enclosed in protective housing
            ctx.fillStyle = '#333333';
            ctx.beginPath();
            ctx.rect(this.x - 52, offsetY + this.height/2 - 7, 7, 14);
            ctx.fill();
            
            // Tail rotor blades (glimpse inside housing)
            ctx.save();
            ctx.translate(this.x - 48, offsetY + this.height/2);
            ctx.rotate(Date.now() / 150);  // Slower rotation
            
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
            
            // Warning stripes/markings - military style
            ctx.fillStyle = this.accentColor;
            
            // Striped warning pattern on tail
            for (let i = 0; i < 3; i++) {
                if (i % 2 === 0) {
                    ctx.fillRect(this.x - 35 + i*7, offsetY + this.height/2 - 2, 7, 4);
                }
            }
            
            // Nose warning stripe
            ctx.fillRect(this.x + 25, offsetY + this.height/2 - 3, 7, 2);
            
            // Military-style markings/insignia
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(this.x, offsetY + this.height/2 - 15, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Heavy-duty landing gear (thicker, with hydraulics)
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 3;
            
            // Front landing gear with hydraulic detail
            ctx.beginPath();
            ctx.moveTo(this.x + 20, offsetY + this.height/2 + 10);
            ctx.lineTo(this.x + 20, offsetY + this.height/2 + 17);
            ctx.lineTo(this.x + 5, offsetY + this.height/2 + 17);
            ctx.stroke();
            
            // Hydraulic detail for front gear
            ctx.beginPath();
            ctx.moveTo(this.x + 18, offsetY + this.height/2 + 10);
            ctx.lineTo(this.x + 16, offsetY + this.height/2 + 14);
            ctx.stroke();
            
            // Rear landing gear with hydraulic detail
            ctx.beginPath();
            ctx.moveTo(this.x - 10, offsetY + this.height/2 + 10);
            ctx.lineTo(this.x - 10, offsetY + this.height/2 + 17);
            ctx.lineTo(this.x - 25, offsetY + this.height/2 + 17);
            ctx.stroke();
            
            // Hydraulic detail for rear gear
            ctx.beginPath();
            ctx.moveTo(this.x - 12, offsetY + this.height/2 + 10);
            ctx.lineTo(this.x - 14, offsetY + this.height/2 + 14);
            ctx.stroke();
            
            // Main rotor - heavier blades, slower rotation
            this.rotorAngle += this.rotorSpeed * 0.8; // Even slower for tanker
            ctx.save();
            ctx.translate(this.x + 5, offsetY + this.height/2 - 20);
            
            // Rotor hub and shaft - larger, industrial looking
            ctx.fillStyle = '#333333';
            // Shaft
            ctx.fillRect(-3, -8, 6, 8);
            // Hub
            ctx.fillRect(-6, -2, 12, 4);
            
            // Heavy-duty rotor blades - thicker, more substantial
            for (let i = 0; i < 2; i++) {
                ctx.save();
                ctx.rotate(this.rotorAngle + i * Math.PI);
                
                // Blade with taper
                ctx.fillStyle = '#333333';
                ctx.beginPath();
                ctx.moveTo(-3, 0);
                ctx.lineTo(-this.width/2 - 5, -2);
                ctx.lineTo(-this.width/2 - 5, 2);
                ctx.lineTo(3, 0);
                ctx.closePath();
                ctx.fill();
                
                // Do the same for the other side
                ctx.beginPath();
                ctx.moveTo(3, 0);
                ctx.lineTo(this.width/2 + 5, -2);
                ctx.lineTo(this.width/2 + 5, 2);
                ctx.lineTo(-3, 0);
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
            }
            ctx.restore();
        }
        
        ctx.restore();
    }

    drawBody(ctx) {
        // This is a simplified version of the draw method that only draws the helicopter body
        // without game-specific elements like rotor animation, hitbox, etc.
        
        if (this.type === 'scout') {
            // Scout - sleek and aerodynamic
            ctx.fillStyle = this.bodyColor;
            ctx.beginPath();
            ctx.ellipse(0, 0, 15, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw cockpit
            ctx.fillStyle = '#ADD8E6';
            ctx.beginPath();
            ctx.ellipse(5, -2, 7, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw tail
            ctx.fillStyle = this.bodyColor;
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(-25, -5);
            ctx.lineTo(-25, 5);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'tanker') {
            // Tanker - military transport style
            
            // Apply the vertical offset
            ctx.translate(0, this.verticalOffset || 0);
            
            // Main body - chunky rectangular shape
            ctx.fillStyle = this.bodyColor;
            ctx.fillRect(-15, -10, 40, 20);
            
            // Nose section
            ctx.beginPath();
            ctx.moveTo(25, -5);  // Top front
            ctx.lineTo(30, 0);   // Nose point
            ctx.lineTo(25, 5);   // Bottom front
            ctx.lineTo(20, 5);   // Bottom back
            ctx.lineTo(20, -5);  // Top back
            ctx.closePath();
            ctx.fill();
            
            // Cargo compartment on top
            ctx.fillRect(-10, -20, 30, 10);
            
            // Cockpit window
            ctx.fillStyle = 'rgba(135, 206, 235, 0.7)';
            ctx.fillRect(18, -6, 10, 12);
            
            // Tail section
            ctx.fillStyle = this.bodyColor;
            ctx.beginPath();
            ctx.moveTo(-15, -5);
            ctx.lineTo(-35, -8);
            ctx.lineTo(-35, 8);
            ctx.lineTo(-15, 5);
            ctx.closePath();
            ctx.fill();
            
            // Vertical stabilizer
            ctx.beginPath();
            ctx.moveTo(-30, -8);
            ctx.lineTo(-30, -18);
            ctx.lineTo(-25, -18);
            ctx.lineTo(-25, -8);
            ctx.closePath();
            ctx.fill();
            
            // Warning stripes
            ctx.fillStyle = this.accentColor;
            ctx.fillRect(-25, -2, 5, 4);
            
            // Military insignia
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(0, -15, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw rotor base (common for both types)
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(0, -8, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw static rotor (common for both types)
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-20, -8);
        ctx.lineTo(20, -8);
        ctx.stroke();
    }

    lift() {
        this.isLifting = true;
        // Play helicopter sound when lifting
        if (!this.liftSound && this.gameAudio) {
            this.liftSound = this.gameAudio.play('helicopter', true);  // Make sure to pass true for loop
        }
    }

    stopLift() {
        this.isLifting = false;
        // Stop helicopter sound when not lifting
        if (this.liftSound && this.gameAudio) {
            this.gameAudio.stopSound(this.liftSound);
            this.liftSound = null;
        }
    }

    setType(type) {
        this.type = type;
        
        // Update helicopter properties based on type
        if (type === 'scout') {
            // Scout helicopter - sleek and aerodynamic
            this.bodyColor = '#4682B4'; // Steel blue
            this.accentColor = '#FFD700'; // Bright yellow
            this.gravity = 0.20;
            this.liftForce = -4;
            this.maxLiftVelocity = 4;
            
            // Standard size
            this.width = 50; 
            this.height = 20;
            
            // Standard vertical offset (for helipad positioning)
            this.verticalOffset = 0;
        } else if (type === 'tanker') {
            // Tanker helicopter - heavier and bulkier
            this.bodyColor = '#5D4037'; // Dark brown
            this.accentColor = '#FF6F00'; // Orange warning color
            this.gravity = 0.35;
            this.liftForce = -3;
            this.maxLiftVelocity = 7;
            
            // Larger size for tanker
            this.width = 70;
            this.height = 30;
            
            // Make it sit higher on the helipad
            this.verticalOffset = -6;
        }
    }
}

class Obstacle {
    constructor(canvas, score) {
        this.canvas = canvas;
        this.width = 100 + Math.random() * 60;
        this.x = canvas.width;
        
        // Calculate difficulty level (every 250 points instead of 50)
        const difficultyLevel = Math.floor(score / 250);
        
        // Reduce gap size as difficulty increases
        const baseMinGap = 130;
        const baseMaxGap = 180;
        const gapReduction = Math.min(difficultyLevel * 30, 40);
        
        // Calculate initial gaps
        let minGap = Math.max(baseMinGap - gapReduction, 40);
        let maxGap = Math.max(baseMaxGap - gapReduction, 70);
        
        // Hard mode after score 1000
        if (score > 1000) {
            minGap = Math.floor(minGap * 0.5);
            maxGap = Math.floor(maxGap * 0.5);
        }
        
        this.gap = minGap + Math.random() * (maxGap - minGap);
        
        // Divide canvas into three sections for gap placement
        const safeZone = 80;
        const playableHeight = canvas.height - (2 * safeZone);
        const sectionHeight = playableHeight / 3;
        
        // Randomly choose which section to put the gap in
        const section = Math.floor(Math.random() * 3);
        
        // Calculate gap position based on section
        const sectionStart = safeZone + (section * sectionHeight);
        const sectionEnd = sectionStart + sectionHeight - this.gap;
        
        // Place gap randomly within the chosen section
        this.gapPosition = sectionStart + Math.random() * (sectionEnd - sectionStart);
        
        // Generate jagged points with guaranteed minimum height for top obstacle
        this.topPoints = this.generateJaggedPoints(true);
        this.bottomPoints = this.generateJaggedPoints(false);
    }

    generateJaggedPoints(isTop) {
        const points = [];
        const segments = 8;
        const segmentWidth = this.width / segments;
        
        for (let i = 0; i <= segments; i++) {
            const x = this.x + (i * segmentWidth);
            let y;
            
            // Use same logic for both top and bottom, just flip for bottom
            const maxExtend = isTop ? 
                (this.gapPosition - 20) : 
                (this.canvas.height - (this.gapPosition + this.gap) - 20);
                
            const minHeight = maxExtend * 0.4;
            
            let taperFactor = 1;
            if (i <= 1) taperFactor = i / 1;
            if (i >= segments - 1) taperFactor = (segments - i) / 1;
            
            y = (minHeight + (maxExtend - minHeight) * Math.random()) * taperFactor;
            
            // For bottom formations, flip the Y coordinate
            if (!isTop) {
                y = this.canvas.height - y;
            } else {
                y = y;  // Keep top formations as they are
            }
            
            // Add intermediate points for smoother shapes
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
        // Move obstacle left
        this.x -= scrollSpeed;
        
        // Update all points
        this.topPoints.forEach(point => {
            point.x -= scrollSpeed;
        });
        this.bottomPoints.forEach(point => {
            point.x -= scrollSpeed;
        });
    }

    draw(ctx) {
        ctx.fillStyle = '#2E8B57';
        
        // Draw top stalactites
        ctx.beginPath();
        ctx.moveTo(this.topPoints[0].x, 0);
        for (let i = 0; i < this.topPoints.length; i++) {
            const point = this.topPoints[i];
            if (i === 0) {
                ctx.lineTo(point.x, point.y);
            } else {
                // Create curved connections between points
                const prevPoint = this.topPoints[i - 1];
                const cpX = (prevPoint.x + point.x) / 2;
                ctx.quadraticCurveTo(cpX, prevPoint.y, point.x, point.y);
            }
        }
        ctx.lineTo(this.topPoints[this.topPoints.length - 1].x, 0);
        ctx.fill();
        
        // Draw bottom stalagmites
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
    }

    collidesWith(helicopter) {
        const hx = helicopter.x;
        const hy = helicopter.y;
        const hw = helicopter.width;
        const hh = helicopter.height;

        // Basic horizontal collision check
        if (hx + hw < this.x || hx > this.x + this.width) {
            return false;
        }

        // Find the relevant segment for collision checking
        const segments = this.topPoints.length - 1;
        const segmentWidth = this.width / segments;
        const relativeX = hx - this.x;
        const segment = Math.min(Math.floor(relativeX / segmentWidth), segments - 1);
        
        if (segment < 0) return false;

        // Get the y-values at this x-position by interpolating between points
        const topY = this.interpolateY(this.topPoints[segment], this.topPoints[segment + 1], hx);
        const bottomY = this.interpolateY(this.bottomPoints[segment], this.bottomPoints[segment + 1], hx);

        // Check if helicopter intersects with obstacles
        return hy < topY || (hy + hh) > bottomY;
    }

    interpolateY(p1, p2, x) {
        const ratio = (x - p1.x) / (p2.x - p1.x);
        return p1.y + (p2.y - p1.y) * ratio;
    }
}

class BackgroundFormation {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = 80 + Math.random() * 120; // Much wider (was 40 + random * 60)
        this.x = canvas.width;
        this.height = 60 + Math.random() * 120; // Much taller (was 30 + random * 80)
        this.isTop = Math.random() > 0.5;
        this.points = this.generatePoints();
    }

    generatePoints() {
        const points = [];
        const segments = 4 + Math.floor(Math.random() * 3); // Fewer segments for bigger shapes
        const segmentWidth = this.width / segments;
        
        for (let i = 0; i <= segments; i++) {
            const x = this.x + (i * segmentWidth);
            let height = this.height * (0.6 + Math.random() * 0.4); // More consistent height
            
            if (i === 0 || i === segments) {
                height *= 0.2; // More aggressive tapering at ends
            }
            
            points.push({
                x,
                y: this.isTop ? height : this.canvas.height - height
            });
        }
        return points;
    }

    update(scrollSpeed) {
        this.x -= scrollSpeed * 0.3; // Slower parallax effect
        this.points.forEach(point => {
            point.x -= scrollSpeed * 0.3;
        });
    }

    draw(ctx) {
        // Much darker shade of green
        ctx.fillStyle = '#0A3015';
        
        ctx.beginPath();
        if (this.isTop) {
            ctx.moveTo(this.points[0].x, 0);
            this.points.forEach((point, i) => {
                if (i === 0) {
                    ctx.lineTo(point.x, point.y);
                } else {
                    const prevPoint = this.points[i - 1];
                    const cpX = (prevPoint.x + point.x) / 2;
                    ctx.quadraticCurveTo(cpX, prevPoint.y, point.x, point.y);
                }
            });
            ctx.lineTo(this.points[this.points.length - 1].x, 0);
        } else {
            ctx.moveTo(this.points[0].x, this.canvas.height);
            this.points.forEach((point, i) => {
                if (i === 0) {
                    ctx.lineTo(point.x, point.y);
                } else {
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
        this.segmentWidth = 50; // Smaller segments for more variation
        this.points = [];
        this.generateInitialPoints();
    }

    generateInitialPoints() {
        // Generate points across entire canvas width plus buffer
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
        // Add new point at the right edge
        const x = this.points[this.points.length - 1].x + this.segmentWidth;
        const height = 5 + Math.random() * 10;
        this.points.push({
            x,
            y: this.isTop ? height : this.canvas.height - height
        });
    }

    update(scrollSpeed) {
        // Move all points left at full speed (removed the * 0.5)
        this.points.forEach(point => {
            point.x -= scrollSpeed;  // Changed from scrollSpeed * 0.5
        });

        // Remove points that are off screen
        while (this.points.length > 0 && this.points[0].x + this.segmentWidth < 0) {
            this.points.shift();
        }

        // Add new points as needed
        while (this.points[this.points.length - 1].x < this.canvas.width + this.segmentWidth) {
            this.addNewPoint();
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#2E8B57';
        ctx.beginPath();
        
        if (this.isTop) {
            ctx.moveTo(this.points[0].x, 0);
            this.points.forEach((point, i) => {
                if (i === 0) {
                    ctx.lineTo(point.x, point.y);
                } else {
                    const prevPoint = this.points[i - 1];
                    const cpX = (prevPoint.x + point.x) / 2;
                    ctx.quadraticCurveTo(cpX, prevPoint.y, point.x, point.y);
                }
            });
            ctx.lineTo(this.points[this.points.length - 1].x, 0);
        } else {
            ctx.moveTo(this.points[0].x, this.canvas.height);
            this.points.forEach((point, i) => {
                if (i === 0) {
                    ctx.lineTo(point.x, point.y);
                } else {
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

class Helipad {
    constructor(canvas, offset = 0) {
        this.canvas = canvas;
        this.width = 120;
        this.height = 10;
        this.x = 60 + offset;
        this.y = canvas.height - this.height - 20;
    }

    update(scrollSpeed) {
        // Move helipad with game scroll
        this.x -= scrollSpeed;
    }

    draw(ctx) {
        // Draw helipad base structure
        ctx.fillStyle = '#444444';
        
        // Frame dimensions
        const frameThickness = 5;
        const frameHeight = 15;
        
        // Left vertical support
        ctx.fillRect(this.x + 10, this.y + this.height, frameThickness, frameHeight);
        
        // Right vertical support
        ctx.fillRect(this.x + this.width - 15, this.y + this.height, frameThickness, frameHeight);
        
        // Bottom horizontal support
        ctx.fillRect(this.x, this.y + this.height + frameHeight, this.width, frameThickness);
        
        // Draw main helipad
        ctx.fillStyle = '#333333';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw landing markers
        ctx.fillStyle = '#FFFF00';
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
        
        // Removed the H marking for better visibility
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

class GameAudio {
    constructor() {
        this.sounds = {};
        this.isMuted = false;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.5;  // Set initial volume to 50%
        this.masterGain.connect(this.audioContext.destination);
        
        // Create HTML5 Audio elements for one-off sounds
        this.crashSound = new Audio('sounds/crash.wav');
        this.crashSound.volume = 0.5;
        this.difficultySound = new Audio('sounds/difficulty-increase.wav');  // Updated name
        this.difficultySound.volume = 0.5;
        this.highScoreSound = new Audio('sounds/highscore.flac');
        this.highScoreSound.volume = 0.5;
        
        // Keep helicopter in Web Audio API for looping
        this.soundFiles = {
            helicopter: 'sounds/helicopter-loop.wav'
        };
        
        this.loadSounds();
        this.setupMuteButton();
        this.setupHelicopterButton();
        this.setupVolumeControl();

        // Add event listener for user interaction
        document.addEventListener('click', () => this.resumeAudio(), { once: true });
        document.addEventListener('keydown', () => this.resumeAudio(), { once: true });
        document.addEventListener('touchstart', () => this.resumeAudio(), { once: true });
    }

    async resumeAudio() {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        // Also try to play a silent sound to unlock audio on iOS
        this.crashSound.play().then(() => this.crashSound.pause()).catch(() => {});
        this.difficultySound.play().then(() => this.difficultySound.pause()).catch(() => {});  // Updated name
        this.highScoreSound.play().then(() => this.highScoreSound.pause()).catch(() => {});
    }

    loadSounds() {
        const loadPromises = Object.entries(this.soundFiles).map(async ([key, path]) => {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to load ${key}: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.sounds[key] = audioBuffer;
            console.log(`Loaded sound: ${key}`);
        });

        Promise.all(loadPromises)
            .then(() => {
                console.log('All sounds loaded');
            })
            .catch((error) => {
                console.error('Error loading sounds:', error);
            });
    }
    
    play(soundName, loop = false) {
        if (this.isMuted) return null;

        // Resume audio context if needed
        if (this.audioContext.state === 'suspended') {
            this.resumeAudio();
        }

        // Handle one-off sounds with HTML5 Audio
        switch(soundName) {
            case 'crash':
                this.crashSound.currentTime = 0;
                this.crashSound.play().catch(e => {
                    console.error('Error playing crash sound:', e);
                    this.resumeAudio().then(() => this.crashSound.play());
                });
                return null;
            case 'difficulty':  // Updated name
                this.difficultySound.currentTime = 0;
                this.difficultySound.play().catch(e => console.error('Error playing difficulty sound:', e));
                return null;
            case 'highScore':
                this.highScoreSound.currentTime = 0;
                this.highScoreSound.play().catch(e => console.error('Error playing highscore sound:', e));
                return null;
            case 'helicopter':
                // Use Web Audio API for looping helicopter sound
                if (!this.sounds[soundName]) return null;
                const source = this.audioContext.createBufferSource();
                source.buffer = this.sounds[soundName];
                source.connect(this.masterGain);
                source.loop = loop;
                source.start(0);
                return source;
        }
    }
    
    setupMuteButton() {
        const muteButton = document.querySelector('.utility-button[data-action="mute"]');
        if (muteButton) {
            // Set up click handler for mute button
            muteButton.onclick = () => {
                // Toggle mute state
                this.isMuted = !this.isMuted;
                
                // Get volume from slider
                const volumeSlider = document.getElementById('volumeSlider');
                const volume = volumeSlider ? volumeSlider.value / 100 : 0.5;
                
                // Apply mute/unmute to audio context
                this.masterGain.gain.value = this.isMuted ? 0 : volume;
                
                // Update HTML5 Audio elements if they exist
                if (this.crashSound) this.crashSound.muted = this.isMuted;
                if (this.difficultySound) this.difficultySound.muted = this.isMuted;
                if (this.highScoreSound) this.highScoreSound.muted = this.isMuted;
                
                // Update button icon
                muteButton.textContent = this.isMuted ? '🔇' : '🔊';
            };
        }
    }

    setupVolumeControl() {
        const volumeSlider = document.getElementById('volumeSlider');
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.masterGain.gain.value = this.isMuted ? 0 : volume;
            
            // Also update HTML5 Audio elements
            this.crashSound.volume = volume;
            this.difficultySound.volume = volume;  // Updated name
            this.highScoreSound.volume = volume;
        });
    }

    setupHelicopterButton() {
        const helicopterButton = document.querySelector('.utility-button[data-action="helicopter"]');
        const modal = document.getElementById('helicopterModal');
        const closeButton = document.getElementById('closeHelicopterModal');
        
        if (helicopterButton) {
            // Set up click handler to show helicopter modal
            helicopterButton.onclick = () => {
                if (modal) {
                    // Populate options before showing the modal
                    this.populateHelicopterOptions();
                    modal.style.display = 'flex';
                }
            };
        }
        
        if (closeButton) {
            // Set up close button handler
            closeButton.onclick = () => {
                if (modal) {
                    modal.style.display = 'none';
                }
            };
        }
        
        // Add click handler to close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (event) => {
                // Check if the click was directly on the modal background
                // (not on any of its children)
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    }

    // Add back stopSound method
    stopSound(source) {
        if (source) {
            try {
                source.stop();
            } catch (error) {
                console.error('Error stopping sound:', error);
            }
        }
    }
}

class Game {
    constructor() {
        // Move gameAudio initialization earlier
        this.gameAudio = new GameAudio();
        
        // Initialize Firebase
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
        
        // Initialize Firebase with compat version
        firebase.initializeApp(firebaseConfig);
        this.database = firebase.database();
        
        // Initialize empty leaderboard array
        this.leaderboard = [];
        
        // Initialize canvas and other game properties
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set target FPS to 60
        this.fps = 60;
        this.frameInterval = 1000 / this.fps;
        this.lastTime = 0;
        
        const isMobile = window.innerWidth < 400;
        
        // Base obstacle distance we want to maintain (in pixels)
        const targetObstacleDistance = 400;
        
        if (isMobile) {
            this.canvas.width = 600;
            this.canvas.height = 600;
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.scrollSpeed = 8;  // Doubled from 4 to 8
            this.baseScrollSpeed = 480;  // 8 * 60 (pixels per second)
            
            // Calculate the desktop pixel distance between obstacles
            const desktopScrollSpeed = 9;
            const desktopObstacleInterval = Math.round(targetObstacleDistance / desktopScrollSpeed); // ~44
            const desktopPixelDistance = desktopScrollSpeed * desktopObstacleInterval; // ~400px
            
            // Adjust mobile intervals to maintain the same visual distance
            this.obstacleInterval = Math.round(desktopPixelDistance / this.scrollSpeed); // ~50 frames
            this.bgFormationInterval = Math.round(this.obstacleInterval / 2); // ~25 frames
        } else {
            this.canvas.width = 800;
            this.canvas.height = 400;
            this.scrollSpeed = 9;
            this.baseScrollSpeed = 540;  // 9 * 60 (pixels per second)
            this.obstacleInterval = Math.round(targetObstacleDistance / this.scrollSpeed);  // ≈ 44
            this.bgFormationInterval = Math.round(this.obstacleInterval / 2);  // ≈ 22
        }
        
        // Pass gameAudio when creating helicopter
        this.helicopter = new Helicopter(130, this.canvas.height / 2, this.canvas, this.gameAudio);
        // Set the default selected helicopter type
        this.selectedHelicopterType = 'scout';
        
        // Rest of constructor code...
        this.gameState = 'start';
        this.isGameOver = false;
        this.score = 0;
        this.highScore = 0;  // Raw high score (will be divided by 10 for display)
        
        this.obstacles = [];
        this.obstacleTimer = 0;
        
        // Add flag to track space key state
        this.isSpaceKeyDown = false;
        this.waitForSpaceRelease = false;
        
        // Load leaderboard after initialization
        this.loadLeaderboard();
        
        // Update text colors for better visibility on dark background
        this.textColor = '#FFFFFF';
        
        // Update event listeners
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                this.isSpaceKeyDown = true;
                
                if (this.gameState === 'start') {
                    this.gameState = 'takeoff';
                    this.helicopter.y = this.canvas.height - 50; // Adjusted height to match raised helipad
                } else if (this.gameState === 'takeoff') {
                    this.gameState = 'playing';
                    this.helicopter.lift();
                } else if (this.gameState === 'gameover') {
                    // Only restart if we're not waiting for space release
                    if (!this.waitForSpaceRelease) {
                        this.reset();
                        this.gameState = 'takeoff';
                        this.helicopter.y = this.canvas.height - 50; // Adjusted height to match raised helipad
                    }
                } else {
                    this.helicopter.lift();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.isSpaceKeyDown = false;
                this.waitForSpaceRelease = false; // Reset the wait flag when space is released
                this.helicopter.stopLift();
            }
        });

        // Prevent default touch behaviors
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            // Track touch state similar to space key
            this.isSpaceKeyDown = true;
            
            if (this.gameState === 'start') {
                this.gameState = 'takeoff';
                this.helicopter.y = this.canvas.height - 50;
            } else if (this.gameState === 'takeoff') {
                this.gameState = 'playing';
                this.helicopter.lift();
            } else if (this.gameState === 'gameover') {
                // Only restart if we're not waiting for touch release
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
            
            // Reset touch state similar to space key
            this.isSpaceKeyDown = false;
            this.waitForSpaceRelease = false;
            
            this.helicopter.stopLift();
        }, { passive: false });

        // Prevent scrolling when touching the canvas
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        this.leaderboardElement = document.getElementById('leaderboard-entries');
        this.updateLeaderboardDisplay();

        this.backgroundFormations = [];
        this.bgFormationTimer = 0;

        // Replace ConstantFormation with EdgeFormation
        this.edgeFormationTop = new EdgeFormation(this.canvas, true);
        this.edgeFormationBottom = new EdgeFormation(this.canvas, false);

        // Create helipad with offset
        this.helipad = new Helipad(this.canvas, 30);

        this.fps = 60;
        this.frameInterval = 1000 / this.fps;
        this.lastTime = 0;
        this.baseScrollSpeed = 180;  // Pixels per second (previous speed * 60)

        // Add FPS monitoring
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.currentFps = 0;
        
        // Scale factors for different frame rates
        this.targetFps = 60;
        this.speedScale = 1;

        // Initialize GameAudio
        this.helicopterSound = null;  // Store reference to looping helicopter sound

        // Add milestone tracking
        this.lastMilestone = 0;

        // Add explosion particles
        this.explosionParticles = [];

        // Set up helicopter button
        this.setupHelicopterButton();

        // Create decorative elements for the home screen
        this.createHomeScreenElements();
    }

    setupCanvasSize() {
        const isMobile = window.innerWidth < 400;
        const oldWidth = this.canvas.width;
        
        // Base obstacle distance we want to maintain (in pixels)
        const targetObstacleDistance = 400;
        
        if (isMobile) {
            this.canvas.width = 600;
            this.canvas.height = 600;
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.scrollSpeed = 8;  // Doubled from 4 to 8
            this.baseScrollSpeed = 480;  // 8 * 60 (pixels per second)
            
            // Calculate the desktop pixel distance between obstacles
            const desktopScrollSpeed = 9;
            const desktopObstacleInterval = Math.round(targetObstacleDistance / desktopScrollSpeed); // ~44
            const desktopPixelDistance = desktopScrollSpeed * desktopObstacleInterval; // ~400px
            
            // Adjust mobile intervals to maintain the same visual distance
            this.obstacleInterval = Math.round(desktopPixelDistance / this.scrollSpeed); // ~50 frames
            this.bgFormationInterval = Math.round(this.obstacleInterval / 2); // ~25 frames
        } else {
            this.canvas.width = 800;
            this.canvas.height = 400;
            this.scrollSpeed = 9;
            this.baseScrollSpeed = 540;  // 9 * 60 (pixels per second)
            
            // Update intervals for desktop
            this.obstacleInterval = Math.round(targetObstacleDistance / this.scrollSpeed);  // ≈ 44
            this.bgFormationInterval = Math.round(this.obstacleInterval / 2);  // ≈ 22
        }

        // Adjust helicopter position proportionally if canvas size changed
        if (this.helicopter) {
            this.helicopter.x = this.helicopter.x * (this.canvas.width / oldWidth);
        }
    }

    // Add resize handler
    handleResize() {
        const oldWidth = this.canvas.width;
        const oldHeight = this.canvas.height;
        
        this.setupCanvasSize();
        
        // Scale game objects' positions
        const scaleX = this.canvas.width / oldWidth;
        const scaleY = this.canvas.height / oldHeight;
        
        this.helicopter.x *= scaleX;
        this.helicopter.y *= scaleY;
        
        // Scale other game objects similarly...
    }

    updateFps(timestamp) {
        this.frameCount++;
        
        // Update FPS every second
        if (timestamp - this.lastFpsUpdate >= 1000) {
            this.currentFps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = timestamp;
            
            // Adjust speed scale based on frame rate
            this.speedScale = this.targetFps / Math.max(this.currentFps, 1);
            
            // Remove or comment out the console.log
            // console.log(`FPS: ${this.currentFps}, Speed Scale: ${this.speedScale.toFixed(2)}`);
        }
    }

    gameLoop(timestamp) {
        // Calculate time elapsed
        const elapsed = timestamp - this.lastTime;

        // Only update if enough time has passed
        if (elapsed > this.frameInterval) {
            // Update last time, accounting for any excess time
            this.lastTime = timestamp - (elapsed % this.frameInterval);
            
            this.update();
            this.draw();
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    // In the Game class, add a method to get the current scroll speed
    getScrollSpeed() {
        // Return the raw scroll speed without any scaling
        return this.scrollSpeed;
    }

    // Then modify the update method to use this getter
    update() {
        // Get the current scroll speed for consistent movement
        const currentScrollSpeed = this.getScrollSpeed();
        
        // Update ambient particles in all game states
        this.ambientParticles.forEach(p => {
            p.y -= p.speed;
            if (p.y < 0) {
                p.y = this.canvas.height;
                p.x = Math.random() * this.canvas.width;
            }
        });
        
        if (this.gameState === 'start') {
            // Update home screen background formations
            this.homeBackgroundFormations.forEach(formation => {
                formation.update(currentScrollSpeed * 0.5); // Slower movement for aesthetic effect
            });
            
            // Update home screen edge formations
            this.homeEdgeFormationTop.update(currentScrollSpeed * 0.5);
            this.homeEdgeFormationBottom.update(currentScrollSpeed * 0.5);
            
            // Update decorative helicopter (just for animation, no physics)
            if (this.decorativeHelicopter) {
                // Make the helicopter bob up and down slightly
                this.decorativeHelicopter.y += Math.sin(Date.now() / 300) * 0.5;
            }
            
            return;
        }
        
        if (this.gameState === 'playing') {
            // Update background formations
            this.bgFormationTimer++;
            if (this.bgFormationTimer > this.bgFormationInterval) {
                this.backgroundFormations.push(new BackgroundFormation(this.canvas));
                this.bgFormationTimer = 0;
            }

            // Update and remove off-screen background formations
            for (let i = this.backgroundFormations.length - 1; i >= 0; i--) {
                const formation = this.backgroundFormations[i];
                formation.update(currentScrollSpeed);
                if (formation.x + formation.width < 0) {
                    this.backgroundFormations.splice(i, 1);
                }
            }

            if (!this.isGameOver) {
                this.helicopter.update();
                
                // Check for floor/ceiling collisions
                if (this.helicopter.y <= 0 || 
                    this.helicopter.y >= this.canvas.height - this.helicopter.height) {
                    this.handleCollision();
                    return;
                }
                
                // Update obstacles
                this.obstacleTimer++;
                if (this.obstacleTimer > this.obstacleInterval) {
                    this.obstacles.push(new Obstacle(this.canvas, Math.floor(this.score / 10)));
                    this.obstacleTimer = 0;
                }

                // Update and check each obstacle
                for (let i = this.obstacles.length - 1; i >= 0; i--) {
                    const obstacle = this.obstacles[i];
                    obstacle.update(currentScrollSpeed);

                    // Remove obstacles that are off screen
                    if (obstacle.x + obstacle.width < 0) {
                        this.obstacles.splice(i, 1);
                        continue;
                    }

                    // Check for collisions
                    if (obstacle.collidesWith(this.helicopter)) {
                        this.handleCollision();
                    }
                }

                // Check for milestone (every 250 points up to 1000)
                const gameScore = Math.floor(this.score / 10);  // Convert to game score
                const currentMilestone = Math.floor(gameScore / 250) * 250;  // Every 250 points of game score
                if (currentMilestone > this.lastMilestone && currentMilestone <= 1000) {
                    console.log('Playing difficulty increase sound at game score:', currentMilestone);
                    this.gameAudio.play('difficulty');  // Updated name
                    this.lastMilestone = currentMilestone;
                }

                // Update score based on frame rate
                this.score += (60 / this.fps);  // Normalize score increase to 60fps
            }

            // Update edge formations
            this.edgeFormationTop.update(currentScrollSpeed);
            this.edgeFormationBottom.update(currentScrollSpeed);

            // Update helipad if it exists
            if (this.helipad && !this.helipad.isOffScreen()) {
                this.helipad.update(currentScrollSpeed);
            }
            
            // Update explosion particles
            for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
                this.explosionParticles[i].update();
                if (this.explosionParticles[i].opacity <= 0) {
                    this.explosionParticles.splice(i, 1);
                }
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameState === 'start') {
            // Draw home screen elements
            this.drawHomeScreenElements();
            
            // Draw title and instructions
            this.ctx.fillStyle = this.textColor;
            this.ctx.textAlign = 'center';
            
            // Add a subtle text shadow
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 5;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
            
            this.ctx.font = '48px Arial';
            this.ctx.fillText('Helicopter Game', 
                this.canvas.width / 2, 
                this.canvas.height / 2 - 40);
            
            this.ctx.font = '24px Arial';
            const isMobile = ('ontouchstart' in window);
            this.ctx.fillText(isMobile ? 'Tap to Start' : 'Press Space to Start', 
                this.canvas.width / 2, 
                this.canvas.height / 2 + 20);
            
            // Reset shadow
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            
            this.ctx.textAlign = 'left';
            return;
        }
        
        if (this.gameState === 'playing' || this.gameState === 'gameover' || this.gameState === 'takeoff') {
            // Draw background formations first
            this.backgroundFormations.forEach(formation => formation.draw(this.ctx));
            
            // Draw edge formations
            this.edgeFormationTop.draw(this.ctx);
            this.edgeFormationBottom.draw(this.ctx);
            
            // Draw ambient particles
            this.ambientParticles.forEach(p => {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
            
            // Draw helipad if it exists and is on screen
            if (this.helipad && !this.helipad.isOffScreen()) {
                this.helipad.draw(this.ctx);
            }
            
            // Then draw main obstacles and helicopter
            this.obstacles.forEach(obstacle => obstacle.draw(this.ctx));
            this.helicopter.draw(this.ctx);
        }
        
        // Draw scores with adjusted positioning for mobile
        if (this.gameState === 'playing' || this.gameState === 'gameover') {
            const isMobile = window.innerWidth < 400;
            const padding = isMobile ? 20 : 10;  // More padding on mobile
            
            this.ctx.fillStyle = this.textColor;
            this.ctx.font = '20px Arial';
            
            // Draw current score
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`Score: ${Math.floor(this.score / 10)}`, padding, 30);
            
            // Draw high score with more space from right edge
            this.ctx.textAlign = 'right';
            this.ctx.fillText(
                `High Score: ${Math.floor(this.highScore / 10)}`, 
                this.canvas.width - padding, 
                30
            );
            this.ctx.textAlign = 'left';  // Reset alignment
        }

        // Draw takeoff instructions
        if (this.gameState === 'takeoff') {
            this.ctx.fillStyle = this.textColor;
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            const isMobile = ('ontouchstart' in window);
            this.ctx.fillText(isMobile ? 'Tap to Take Off' : 'Press Space to Take Off', 
                this.canvas.width / 2, 
                this.canvas.height / 2);
            this.ctx.textAlign = 'left';
        }

        // Draw game over message
        if (this.gameState === 'gameover') {
            this.ctx.fillStyle = this.textColor;
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', 
                this.canvas.width / 2, 
                this.canvas.height / 2);
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Press Space to Restart', 
                this.canvas.width / 2, 
                this.canvas.height / 2 + 40);
            this.ctx.textAlign = 'left';
        }

        // Draw explosion particles
        if (this.explosionParticles.length > 0) {
            this.explosionParticles.forEach((particle, index) => {
                particle.update();
                particle.draw(this.ctx);
                if (particle.opacity <= 0) {
                    this.explosionParticles.splice(index, 1);
                }
            });
        }
    }

    reset() {
        // Stop helicopter sound if playing
        if (this.helicopter.liftSound) {
            this.gameAudio.stopSound(this.helicopter.liftSound);
            this.helicopter.liftSound = null;
        }
        
        // Store the current helicopter type before creating a new helicopter
        const currentType = this.selectedHelicopterType || 'scout';
        
        // Create new helicopter
        this.helicopter = new Helicopter(130, this.canvas.height - 50, this.canvas, this.gameAudio);
        
        // Set the helicopter type to the previously selected type
        this.helicopter.setType(currentType);
        
        this.helipad = new Helipad(this.canvas, 30);
        this.obstacles = [];
        this.obstacleTimer = 0;
        this.score = 0;
        this.isGameOver = false;
        this.lastMilestone = 0;
        this.gameState = 'start';
        
        // Clear explosion particles
        this.explosionParticles = [];
        
        // Recreate home screen elements
        this.createHomeScreenElements();
    }

    start() {
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    updateLeaderboardDisplay() {
        // Add header row
        let leaderboardHTML = `
            <div class="score-entry header">
                <span>Pilot</span>
                <span class="helicopter-type">Type</span>
                <span>Score</span>
            </div>
        `;
        
        // Add entries
        leaderboardHTML += this.leaderboard
            .map((entry, index) => {
                let position;
                switch(index) {
                    case 0:
                        position = '🥇';  // Gold medal
                        break;
                    case 1:
                        position = '🥈';  // Silver medal
                        break;
                    case 2:
                        position = '🥉';  // Bronze medal
                        break;
                    default:
                        position = `${index + 1}.`;
                }
                
                // Use a default value if helicopterType is not available (for backward compatibility)
                const helicopterType = entry.helicopterType || '---';
                
                // Format score with leading zeros at 60% opacity
                const scoreStr = entry.score.toString();
                const paddedScore = scoreStr.padStart(6, '0');
                const leadingZerosCount = paddedScore.length - scoreStr.length;
                
                let formattedScore = '';
                if (leadingZerosCount > 0) {
                    formattedScore = `<span style="opacity: 0.6">${paddedScore.substring(0, leadingZerosCount)}</span>${scoreStr}`;
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
        this.database.ref('leaderboard').once('value')
            .then((snapshot) => {
                const data = snapshot.val();
                this.leaderboard = Object.values(data)
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 5);
                this.updateLeaderboardDisplay();
            });
    }

    updateHighScore() {
        // Compare raw scores (not divided)
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }
        
        const currentScore = Math.floor(this.score / 10);
        // Only show modal and play sound if we make it onto the leaderboard
        if (this.leaderboard.length < 5 || currentScore > this.leaderboard[this.leaderboard.length - 1].score) {
            // Play high score sound
            setTimeout(() => {
                this.gameAudio.play('highScore');
            }, 500);
            
            // Show modal
            const modal = document.getElementById('highScoreModal');
            const input = document.getElementById('initialsInput');
            const submitBtn = document.getElementById('submitScore');
            
            modal.style.display = 'flex';
            input.value = '';
            input.focus();
            
            const handleSubmit = () => {
                let initials = input.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'AAA';
                
                // Capitalize first letter of helicopter type for display
                const helicopterType = this.selectedHelicopterType.charAt(0).toUpperCase() + this.selectedHelicopterType.slice(1);
                
                // Add new score to Firebase
                const newScoreRef = this.database.ref('leaderboard').push();
                newScoreRef.set({
                    initials: initials,
                    score: currentScore,
                    date: new Date().toLocaleDateString(),
                    helicopterType: helicopterType // Add helicopter type to the entry
                }).then(() => {
                    // Reload leaderboard after adding new score
                    this.loadLeaderboard();
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

    // Add new method for explosion effect
    createExplosion(x, y) {
        const numParticles = 30;
        for (let i = 0; i < numParticles; i++) {
            const angle = (Math.PI * 2 * i) / numParticles;
            const speed = 2 + Math.random() * 2;
            const particle = new ExplosionParticle(x, y, angle, speed);
            this.explosionParticles.push(particle);
        }
    }

    handleCollision() {
        this.gameState = 'gameover';
        this.isGameOver = true;
        
        // Set flag to wait for space release if space is currently down
        if (this.isSpaceKeyDown) {
            this.waitForSpaceRelease = true;
        }
        
        // Play crash sound first
        this.gameAudio.play('crash');
        
        // Create explosion effect
        this.createExplosion(this.helicopter.x, this.helicopter.y);
        
        // Stop helicopter sound
        if (this.helicopter.liftSound) {
            this.gameAudio.stopSound(this.helicopter.liftSound);
            this.helicopter.liftSound = null;
        }
        
        this.updateHighScore();
    }

    clearHighScore() {
        this.highScore = 0;
        localStorage.setItem('highScore', '0');
    }

    // Add this method to the Game class to set up the helicopter button
    setupHelicopterButton() {
        const helicopterButton = document.querySelector('.utility-button[data-action="helicopter"]');
        const modal = document.getElementById('helicopterModal');
        const closeButton = document.getElementById('closeHelicopterModal');
        
        if (helicopterButton) {
            // Set up click handler to show helicopter modal
            helicopterButton.onclick = () => {
                if (modal) {
                    // Populate options before showing the modal
                    this.populateHelicopterOptions();
                    modal.style.display = 'flex';
                }
            };
        }
        
        if (closeButton) {
            // Set up close button handler
            closeButton.onclick = () => {
                if (modal) {
                    modal.style.display = 'none';
                }
            };
        }
        
        // Add click handler to close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (event) => {
                // Check if the click was directly on the modal background
                // (not on any of its children)
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    }

    // Add populateHelicopterOptions to Game class
    populateHelicopterOptions() {
        const modalContent = document.querySelector('#helicopterModal .modal-content');
        if (!modalContent) return;
        
        // Add close icon if it doesn't exist
        if (!modalContent.querySelector('.close-icon')) {
            const closeIcon = document.createElement('span');
            closeIcon.className = 'close-icon';
            closeIcon.innerHTML = '&times;';
            closeIcon.addEventListener('click', () => {
                document.getElementById('helicopterModal').style.display = 'none';
            });
            modalContent.prepend(closeIcon);
        }
        
        // Remove any existing close button
        const closeButton = modalContent.querySelector('.close-button');
        if (closeButton) {
            closeButton.remove();
        }
        
        // Add or update title
        let titleElement = modalContent.querySelector('h3');
        if (!titleElement) {
            titleElement = document.createElement('h3');
            modalContent.insertBefore(titleElement, modalContent.firstChild);
        }
        titleElement.textContent = 'Choose Your Helicopter';
        
        const optionsContainer = modalContent.querySelector('.helicopter-options');
        if (!optionsContainer) return;
        
        // Clear existing options
        optionsContainer.innerHTML = '';
        
        // Helper function to generate block ratings
        const generateBlockRating = (rating) => {
            let blocks = '';
            for (let i = 1; i <= 5; i++) {
                blocks += `<div class="stat-block ${i <= rating ? 'filled' : 'empty'}"></div>`;
            }
            return `<div class="stat-blocks">${blocks}</div>`;
        };
        
        // Create card-based options with block rating system
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
        
        // Add event listeners to helicopter cards
        const helicopterCards = document.querySelectorAll('.helicopter-card');
        helicopterCards.forEach(card => {
            card.addEventListener('click', () => {
                const type = card.getAttribute('data-type');
                this.selectedHelicopterType = type;
                
                // Remove selected and active classes from all cards
                helicopterCards.forEach(c => {
                    c.classList.remove('selected');
                    c.classList.remove('active');
                });
                
                // Add selected and active classes to clicked card
                card.classList.add('selected');
                card.classList.add('active');
                
                // Update helicopter type
                if (type === 'scout') {
                    this.helicopter.setType('scout');
                } else if (type === 'tanker') {
                    this.helicopter.setType('tanker');
                }
                
                // Update the decorative helicopter on the homescreen
                if (this.decorativeHelicopter) {
                    this.decorativeHelicopter.setType(type);
                }
                
                // Close the modal
                document.getElementById('helicopterModal').style.display = 'none';
            });
        });
        
        // If no helicopter type is selected yet, set the default to Scout
        if (!this.selectedHelicopterType) {
            this.selectedHelicopterType = 'scout';
            this.helicopter.setType('scout');
        }
    }

    // Create decorative elements for the home screen
    createHomeScreenElements() {
        // Create background formations similar to the game
        this.homeBackgroundFormations = [];
        for (let i = 0; i < 3; i++) {
            this.homeBackgroundFormations.push(new BackgroundFormation(this.canvas));
        }
        
        // Create edge formations for top and bottom
        this.homeEdgeFormationTop = new EdgeFormation(this.canvas, true);
        this.homeEdgeFormationBottom = new EdgeFormation(this.canvas, false);
        
        // Create a decorative helicopter using the actual helicopter class
        // Position it in the center of the screen
        this.decorativeHelicopter = new Helicopter(
            this.canvas.width * 0.2, 
            this.canvas.height * 0.5, 
            this.canvas,
            this.gameAudio
        );
        
        // Set the helicopter type based on the selected type or default to scout
        this.decorativeHelicopter.setType(this.selectedHelicopterType || 'scout');
        
        // Create ambient particles for the home screen
        this.createAmbientParticles();
    }
    
    // Create ambient particles for visual effect
    createAmbientParticles() {
        this.ambientParticles = [];
        for (let i = 0; i < 20; i++) {
            this.ambientParticles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 1 + Math.random() * 2,
                speed: 0.2 + Math.random() * 0.5,
                opacity: 0.2 + Math.random() * 0.3
            });
        }
    }
    
    // Draw home screen decorative elements
    drawHomeScreenElements() {
        // Fill background with game's background color
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background formations
        this.homeBackgroundFormations.forEach(formation => formation.draw(this.ctx));
        
        // Draw edge formations
        this.homeEdgeFormationTop.draw(this.ctx);
        this.homeEdgeFormationBottom.draw(this.ctx);
        
        // Draw ambient particles
        this.ambientParticles.forEach(p => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Move particles upward slowly
            p.y -= p.speed;
            
            // Reset particles that go off screen
            if (p.y < 0) {
                p.y = this.canvas.height;
                p.x = Math.random() * this.canvas.width;
            }
        });
        
        // Draw the decorative helicopter
        // Make the rotor spin even when not lifting, but don't play sound
        const originalLift = this.decorativeHelicopter.lift;
        this.decorativeHelicopter.lift = function() {
            this.isLifting = true;
            // Don't play sound in this case
        };
        
        this.decorativeHelicopter.isLifting = true;
        this.decorativeHelicopter.draw(this.ctx);
        
        // Restore original lift method
        this.decorativeHelicopter.lift = originalLift;
    }
}

// Add new class for explosion particles
class ExplosionParticle {
    constructor(x, y, angle, speed) {
        this.x = x;
        this.y = y;
        this.speedX = Math.cos(angle) * speed;
        this.speedY = Math.sin(angle) * speed;
        this.size = 5 + Math.random() * 5;
        this.opacity = 1;
        this.gravity = 0.2;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.opacity -= 0.02;
        this.size *= 0.95;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 89, 0, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Start the game when the window loads
window.onload = () => {
    const game = new Game();
    game.start();
}; 