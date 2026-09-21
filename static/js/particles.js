/**
 * Demon Slayer Anime Particle & Visual Effects Engine
 * - Dynamic Breathing Ambient Particles (Water, Flame, Thunder, Sun, Beast)
 * - Drifting Wisteria & Sakura Petals
 * - Interactive Nichirin Blade Cursor Trail
 * - Click Shockwave & Water Ripples
 */

class BreathingEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        this.currentStyle = 'Water';
        this.particles = [];
        this.petals = [];
        this.bladeTrails = [];
        this.ripples = [];
        this.mouseX = -100;
        this.mouseY = -100;
        this.lastMouseX = -100;
        this.lastMouseY = -100;

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupInteractivity();
        this.initElements();
        this.animate();
    }

    resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
    }

    setupInteractivity() {
        // Mouse Move -> Blade Trail
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            
            // Add blade trail sparks on movement
            const dist = Math.hypot(this.mouseX - this.lastMouseX, this.mouseY - this.lastMouseY);
            if (dist > 6) {
                const count = Math.min(Math.floor(dist / 6), 4);
                for (let i = 0; i < count; i++) {
                    this.addBladeTrailPoint(this.mouseX, this.mouseY);
                }
                this.lastMouseX = this.mouseX;
                this.lastMouseY = this.mouseY;
            }
        });

        // Click -> Expanding Shockwave / Ripple
        window.addEventListener('click', (e) => {
            this.addShockwave(e.clientX, e.clientY);
        });
    }

    setStyle(style) {
        this.currentStyle = style;
        this.initElements();
    }

    getStyleColors() {
        switch (this.currentStyle) {
            case 'Flame':
                return {
                    primary: '#ff3838',
                    secondary: '#ff9f1a',
                    glow: '#ff5252',
                    palette: ['#ff3838', '#ff793f', '#ffb142', '#ff5252', '#ffffff']
                };
            case 'Thunder':
                return {
                    primary: '#f9ca24',
                    secondary: '#f0932b',
                    glow: '#ffeaa7',
                    palette: ['#f9ca24', '#f0932b', '#ffffff', '#ffeaa7', '#fed330']
                };
            case 'Sun':
                return {
                    primary: '#ff1744',
                    secondary: '#ff9100',
                    glow: '#ffd600',
                    palette: ['#ff1744', '#ff9100', '#ffd600', '#ff5252', '#ffffff']
                };
            case 'Beast':
                return {
                    primary: '#2ed573',
                    secondary: '#1e90ff',
                    glow: '#7bed9f',
                    palette: ['#2ed573', '#1e90ff', '#7bed9f', '#70a1ff', '#ffffff']
                };
            case 'Water':
            default:
                return {
                    primary: '#00d2ff',
                    secondary: '#3a7bd5',
                    glow: '#70a1ff',
                    palette: ['#00d2ff', '#3a7bd5', '#70a1ff', '#54a0ff', '#ffffff']
                };
        }
    }

    initElements() {
        this.particles = [];
        this.petals = [];
        const isMobile = window.innerWidth < 768;
        const particleCount = isMobile ? 35 : 70;
        const petalCount = isMobile ? 12 : 24;

        const colors = this.getStyleColors();

        // 1. Breathing Particles
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(this.createParticle(colors, true));
        }

        // 2. Wisteria & Sakura Petals
        for (let i = 0; i < petalCount; i++) {
            this.petals.push(this.createPetal(true));
        }
    }

    createParticle(colors, randomY = false) {
        const color = colors.palette[Math.floor(Math.random() * colors.palette.length)];
        const isEmber = (this.currentStyle === 'Flame' || this.currentStyle === 'Sun');
        const isThunder = (this.currentStyle === 'Thunder');

        return {
            x: Math.random() * this.width,
            y: randomY ? Math.random() * this.height : (isEmber ? this.height + 15 : -15),
            size: Math.random() * (isEmber ? 3.5 : 4) + 1.2,
            speedY: isEmber ? -(Math.random() * 1.8 + 0.6) : (Math.random() * 1.3 + 0.4),
            speedX: (Math.random() - 0.5) * (isThunder ? 2.5 : 1.2),
            opacity: Math.random() * 0.75 + 0.25,
            pulse: Math.random() * 0.05 + 0.015,
            pulseDir: 1,
            color: color,
            isThunder: isThunder,
            isEmber: isEmber
        };
    }

    createPetal(randomY = false) {
        return {
            x: Math.random() * this.width,
            y: randomY ? Math.random() * this.height : -20,
            size: Math.random() * 6 + 6,
            speedY: Math.random() * 1.2 + 0.6,
            speedX: Math.random() * 1.4 - 0.7,
            angle: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 3,
            opacity: Math.random() * 0.5 + 0.35,
            // Purple wisteria or soft pink sakura
            color: Math.random() > 0.4 ? 'rgba(216, 180, 254, 0.75)' : 'rgba(244, 114, 182, 0.75)'
        };
    }

    addBladeTrailPoint(x, y) {
        const colors = this.getStyleColors();
        const color = colors.palette[Math.floor(Math.random() * colors.palette.length)];
        this.bladeTrails.push({
            x: x + (Math.random() - 0.5) * 12,
            y: y + (Math.random() - 0.5) * 12,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 4.5 + 2,
            color: color,
            life: 1.0,
            decay: Math.random() * 0.04 + 0.04
        });
    }

    addShockwave(x, y) {
        const colors = this.getStyleColors();
        this.ripples.push({
            x: x,
            y: y,
            radius: 5,
            maxRadius: Math.random() * 50 + 60,
            color: colors.primary,
            opacity: 0.9,
            speed: 4.5
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const colors = this.getStyleColors();

        // 1. Update and Render Breathing Particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.y += p.speedY;
            p.x += p.speedX;

            if (p.isThunder && Math.random() < 0.08) {
                p.x += (Math.random() - 0.5) * 12; // Electric jitter
            }

            p.opacity += p.pulse * p.pulseDir;
            if (p.opacity > 0.9) p.pulseDir = -1;
            if (p.opacity < 0.15) p.pulseDir = 1;

            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.opacity;
            this.ctx.shadowBlur = 14;
            this.ctx.shadowColor = p.color;
            this.ctx.fill();
            this.ctx.restore();

            const outOfBounds = p.isEmber 
                ? (p.y < -20 || p.x < -30 || p.x > this.width + 30)
                : (p.y > this.height + 20 || p.x < -30 || p.x > this.width + 30);

            if (outOfBounds) {
                this.particles[i] = this.createParticle(colors, false);
            }
        }

        // 2. Update and Render Wisteria Petals
        for (let i = 0; i < this.petals.length; i++) {
            const petal = this.petals[i];
            petal.y += petal.speedY;
            petal.x += Math.sin(petal.y * 0.015) * 1.5 + petal.speedX;
            petal.angle += petal.rotationSpeed;

            this.ctx.save();
            this.ctx.translate(petal.x, petal.y);
            this.ctx.rotate((petal.angle * Math.PI) / 180);
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, petal.size * 0.5, petal.size, 0, 0, Math.PI * 2);
            this.ctx.fillStyle = petal.color;
            this.ctx.globalAlpha = petal.opacity;
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = petal.color;
            this.ctx.fill();
            this.ctx.restore();

            if (petal.y > this.height + 20 || petal.x < -30 || petal.x > this.width + 30) {
                this.petals[i] = this.createPetal(false);
            }
        }

        // 3. Update and Render Nichirin Blade Cursor Trail
        for (let i = this.bladeTrails.length - 1; i >= 0; i--) {
            const t = this.bladeTrails[i];
            t.x += t.vx;
            t.y += t.vy;
            t.life -= t.decay;

            if (t.life <= 0) {
                this.bladeTrails.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(t.x, t.y, t.size * t.life, 0, Math.PI * 2);
            this.ctx.fillStyle = t.color;
            this.ctx.globalAlpha = t.life * 0.85;
            this.ctx.shadowBlur = 18;
            this.ctx.shadowColor = t.color;
            this.ctx.fill();
            this.ctx.restore();
        }

        // 4. Update and Render Ripples / Shockwaves
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const r = this.ripples[i];
            r.radius += r.speed;
            r.opacity -= 0.025;

            if (r.opacity <= 0 || r.radius >= r.maxRadius) {
                this.ripples.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = r.color;
            this.ctx.lineWidth = 2.5;
            this.ctx.globalAlpha = r.opacity;
            this.ctx.shadowBlur = 16;
            this.ctx.shadowColor = r.color;
            this.ctx.stroke();
            this.ctx.restore();
        }

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize on DOM ready
let particleCanvas = null;
window.addEventListener('DOMContentLoaded', () => {
    particleCanvas = new BreathingEngine('breathing-canvas');
});
