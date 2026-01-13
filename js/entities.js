const random = (min, max) => Math.random() * (max - min) + min;

class Enemy {
    constructor() { this.respawn(); }
    respawn() {
        const margin = 500;
        this.x = random(-margin, window.innerWidth + margin);
        this.y = random(-margin, window.innerHeight + margin);
        this.r = (10 + Math.pow(Math.random(), 1.5) * 50) * (window.innerWidth / 1920); 
        this.maxHp = 1 + Math.floor(Math.random() * 100);
        this.hp = this.maxHp;
        this.colors = CONFIG.ENEMY.PALETTES[Math.floor(Math.random() * CONFIG.ENEMY.PALETTES.length)];
    }
    hit() {
        this.hp--;
        if (this.hp <= 0) { this.respawn(); return true; }
        return false;
    }
    draw(ctx, scaleFactor) {
        ctx.save();
        ctx.translate(this.x, this.y);
        const g = ctx.createRadialGradient(0, 0, this.r * 0.2, 0, 0, this.r);
        g.addColorStop(0, this.colors[0]);
        g.addColorStop(1, this.colors[1]);
        ctx.beginPath();
        ctx.arc(0, 0, this.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.shadowColor = this.colors[1];
        ctx.shadowBlur = 15 * scaleFactor;
        ctx.fill();
        ctx.restore();
    }
}

class Sword {
    constructor(index, scaleFactor) {
        this.index = index;
        this.layer = Math.floor(index / 24); 
        this.baseAngle = (Math.PI * 2 / 24) * (index % 24);
        this.spinAngle = 0;
        this.spinSpeed = (CONFIG.SWORD.SPIN_SPEED_BASE / (this.layer + 1)) * (this.layer % 2 ? -1 : 1);
        this.radius = (CONFIG.SWORD.BASE_RADIUS + this.layer * CONFIG.SWORD.LAYER_SPACING) * scaleFactor;
        this.x = window.innerWidth / 2; this.y = window.innerHeight / 2;
        this.vx = 0; this.vy = 0;
        this.drawAngle = 0;
        this.trail = [];
        this.breath = random(0, Math.PI * 2);
        this.breathSpeed = random(0.015, 0.025);
        this.attackDelay = this.layer * 6 + random(0, 10);
        this.attackFrame = 0;
        this.flowNoise = Math.random() * Math.PI * 2;
        this.flowOffsetAngle = (Math.PI * 2 / 72) * index;
        this.flowOffsetRadius = (40 + Math.random() * 60) * scaleFactor;
    }

    update(guardCenter, enemies, Input, scaleFactor) {
        this.breath += this.breathSpeed;
        const currentRadius = this.radius + Math.sin(this.breath) * 8 * scaleFactor;

        if (!Input.isAttacking) {
            this.updateGuardMode(guardCenter, currentRadius, Input, scaleFactor);
        } else {
            this.updateAttackMode(enemies, Input, scaleFactor);
        }
    }

    updateGuardMode(guardCenter, r, Input, scaleFactor) {
        this.spinAngle += this.spinSpeed;
        const a = this.baseAngle + this.spinAngle;
        const tx = guardCenter.x + Math.cos(a) * r;
        const ty = guardCenter.y + Math.sin(a) * r;

        if (Input.speed > 1.5) {
            this.flowNoise += 0.04;
            const fx = Input.x + Math.cos(this.flowOffsetAngle + this.flowNoise) * this.flowOffsetRadius;
            const fy = Input.y + Math.sin(this.flowOffsetAngle + this.flowNoise) * this.flowOffsetRadius;
            const dx = fx - this.x;
            const dy = fy - this.y;
            const d = Math.hypot(dx, dy) || 1;
            this.vx += (dx / d) * Math.min(d * 0.04, 3 * scaleFactor);
            this.vy += (dy / d) * Math.min(d * 0.04, 3 * scaleFactor);
            this.vx *= 0.9; this.vy *= 0.9;
            this.x += this.vx; this.y += this.vy;
            this.drawAngle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
        } else {
            const dx = tx - this.x;
            const dy = ty - this.y;
            this.x += dx * 0.12; this.y += dy * 0.12;
            this.vx *= 0.5; this.vy *= 0.5;
            let targetAngle = (Input.guardForm === 1) ? a + Math.PI / 2 : Math.atan2(ty - this.y, tx - this.x) + Math.PI / 2;
            let diff = targetAngle - this.drawAngle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.drawAngle += diff * 0.15;
        }
        this.attackFrame = 0;
        this.trail = []; 
    }

    updateAttackMode(enemies, Input, scaleFactor) {
        this.attackFrame++;
        if (this.attackFrame < this.attackDelay) return;
        let target = null, minStartDist = Infinity;
        for (const e of enemies) {
            const d = Math.hypot(e.x - Input.x, e.y - Input.y);
            if (d < minStartDist) { minStartDist = d; target = e; }
        }
        if (target) {
            const dx = target.x - this.x, dy = target.y - this.y;
            const d = Math.hypot(dx, dy) || 1;
            this.vx += (dx / d) * 10 * scaleFactor;
            this.vy += (dy / d) * 10 * scaleFactor;
            this.vx *= 0.92; this.vy *= 0.92;
            this.x += this.vx; this.y += this.vy;
            this.drawAngle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
            if (Math.hypot(this.x - target.x, this.y - target.y) < target.r) target.hit();
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > CONFIG.SWORD.TRAIL_LENGTH) this.trail.shift();
        }
    }

    draw(ctx, scaleFactor) {
        if (this.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) ctx.lineTo(this.trail[i].x, this.trail[i].y);
            ctx.strokeStyle = CONFIG.COLORS.SWORD_TRAIL;
            ctx.lineWidth = 2 * scaleFactor;
            ctx.stroke();
        }
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.drawAngle);
        this.drawAura(ctx, scaleFactor);
        this.drawBlade(ctx, scaleFactor);
        ctx.restore();
    }

    drawAura(ctx, scaleFactor) {
        const auraCount = Math.floor(random(2, 4));
        ctx.shadowColor = "#fffaa0";
        ctx.shadowBlur = 8 * scaleFactor;
        for (let i = 0; i < auraCount; i++) {
            ctx.beginPath();
            let py = -random(0, CONFIG.SWORD.SIZE * scaleFactor);
            let px = random(-3, 3) * scaleFactor;
            ctx.moveTo(px, py);
            for (let s = 0; s < 3; s++) {
                px += random(-4, 4) * scaleFactor;
                py += random(-3, 3) * scaleFactor;
                ctx.lineTo(px, py);
            }
            ctx.strokeStyle = `rgba(255,255,180,${random(0.3, 0.6)})`;
            ctx.lineWidth = 1.5 * scaleFactor;
            ctx.stroke();
        }
    }

    drawBlade(ctx, scaleFactor) {
        const sLen = CONFIG.SWORD.SIZE * scaleFactor;
        const sWid = 4 * scaleFactor;
        ctx.shadowColor = "#8fffe0";
        ctx.shadowBlur = 15 * scaleFactor;
        const g = ctx.createLinearGradient(0, -sLen, 0, 0);
        g.addColorStop(0, CONFIG.COLORS.SWORD_BLADE[0]);
        g.addColorStop(0.5, CONFIG.COLORS.SWORD_BLADE[1]);
        g.addColorStop(1, CONFIG.COLORS.SWORD_BLADE[2]);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(-sWid / 2, 0);
        ctx.lineTo(-sWid / 2, -sLen);
        ctx.quadraticCurveTo(0, -sLen - 10 * scaleFactor, sWid / 2, -sLen);
        ctx.lineTo(sWid / 2, 0);
        ctx.fill();
        ctx.shadowColor = "#9fffe6";
        ctx.fillStyle = "#4fcfb2";
        ctx.beginPath();
        ctx.roundRect(-7*scaleFactor, -1.2*scaleFactor, 14*scaleFactor, 2.4*scaleFactor, 2.4*scaleFactor);
        ctx.fill();
        ctx.fillStyle = "#2f7f68";
        ctx.beginPath();
        ctx.moveTo(-3 * scaleFactor, 0);
        ctx.lineTo(-2 * scaleFactor, 14 * scaleFactor);
        ctx.lineTo(2 * scaleFactor, 14 * scaleFactor);
        ctx.lineTo(3 * scaleFactor, 0);
        ctx.fill();
    }
}

class StarField {
    constructor(count, width, height) {
        this.stars = [];
        for(let i=0; i<count; i++) {
            this.stars.push({
                x: random(-width, width * 2), 
                y: random(-height, height * 2),
                r: random(0.5, 2),
                alpha: random(0.2, 1)
            });
        }
    }
    draw(ctx, scaleFactor) {
        ctx.shadowBlur = 0;
        for (const s of this.stars) {
            s.alpha += random(-0.01, 0.01);
            if (s.alpha > 1) s.alpha = 1; else if (s.alpha < 0.2) s.alpha = 0.2;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r * scaleFactor, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
            ctx.fill();
        }
    }
}